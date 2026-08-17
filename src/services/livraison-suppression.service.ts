import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

/**
 * Suppression d'une livraison et de tout ce qu'elle a engendré.
 *
 * Une livraison créée par l'assistant de pesée porte toujours une pesée, du
 * stock et un bon d'achat : le garde historique `isUsed`, qui refusait dès
 * qu'une de ces lignes existait, rendait donc TOUTE livraison de l'assistant
 * indéfinissablement indestructible. On remplace ce refus global par la seule
 * question qui compte : est-ce que quelque chose d'irréversible a déjà été fait
 * en aval ?
 */

export type MotifBlocageSuppression =
    | "STOCK_VENDU"
    | "STOCK_CONDITIONNE"
    | "STOCK_SORTI"
    | "BON_ACHAT_PAYE"
    | "ECHANTILLON_ANALYSE";

export class LivraisonNonSupprimableError extends Error {
    readonly code = "LIVRAISON_NON_SUPPRIMABLE" as const;
    constructor(readonly motifs: { motif: MotifBlocageSuppression; nombre: number }[]) {
        super("LIVRAISON_NON_SUPPRIMABLE");
        this.name = "LivraisonNonSupprimableError";
    }
}

/**
 * Ce qui interdit la suppression : uniquement les traces laissées EN AVAL.
 * Tant que les dattes n'ont pas bougé et que l'agriculteur n'a pas été payé,
 * une livraison saisie par erreur doit pouvoir être annulée.
 */
export async function verifierSuppressionPossible(
    tenantId: string,
    livraisonId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma
) {
    const [ventes, conditionnements, bonsSortie, paiements, analyses] = await Promise.all([
        client.vente.count({ where: { tenantId, StockDate: { livraisonId } } }),
        client.conditionnement.count({ where: { StockDate: { livraisonId, tenantId } } }),
        client.bonSortie.count({ where: { StockDate: { livraisonId, tenantId } } }),
        client.paiementAgriculteur.count({ where: { tenantId, BonAchat: { livraisonId } } }),
        client.analyse.count({ where: { Echantillon: { livraisonId, tenantId } } }),
    ]);

    const motifs: { motif: MotifBlocageSuppression; nombre: number }[] = [];
    if (ventes > 0) motifs.push({ motif: "STOCK_VENDU", nombre: ventes });
    if (conditionnements > 0) motifs.push({ motif: "STOCK_CONDITIONNE", nombre: conditionnements });
    if (bonsSortie > 0) motifs.push({ motif: "STOCK_SORTI", nombre: bonsSortie });
    if (paiements > 0) motifs.push({ motif: "BON_ACHAT_PAYE", nombre: paiements });
    if (analyses > 0) motifs.push({ motif: "ECHANTILLON_ANALYSE", nombre: analyses });

    return motifs;
}

/**
 * Annule les retours de caisses que la pesée avait enregistrés automatiquement.
 *
 * Le nombre à annuler vient de `Pesee.caissesRetournees`, c'est-à-dire de ce qui
 * a RÉELLEMENT été remis au stock — et non du nombre de caisses pesées. La
 * différence est décisive : quand l'agriculteur n'avait aucun prêt ouvert,
 * aucune caisse n'est revenue, et se fier au nombre pesé retirerait du stock
 * des caisses qui n'y avaient jamais été ajoutées.
 *
 * ⚠️ Limite résiduelle : on sait COMBIEN a été retourné, pas SUR QUEL prêt —
 * le retour automatique choisit le plus ancien prêt EN_COURS sans le consigner.
 * La reprise se fait donc sur les prêts du même agriculteur et du même type, du
 * plus récent au plus ancien. Le total est exact ; seule la répartition entre
 * prêts peut différer de l'originale.
 *
 * @returns le nombre de caisses effectivement « dé-retournées », par type.
 */
async function annulerRetoursCaisses(
    tx: Prisma.TransactionClient,
    tenantId: string,
    agriculteurId: string,
    caissesParType: Map<string, number>
) {
    const annuleParType = new Map<string, number>();

    for (const [typeCaisseId, aAnnuler] of caissesParType) {
        let restant = aAnnuler;

        const prets = await tx.pretCaisse.findMany({
            where: { tenantId, agriculteurId, typeCaisseId, nombreRetourne: { gt: 0 } },
            orderBy: { datePreT: "desc" },
            select: { id: true, nombreRetourne: true, statut: true },
        });

        for (const pret of prets) {
            if (restant <= 0) break;
            const reprise = Math.min(restant, pret.nombreRetourne);

            await tx.pretCaisse.update({
                where: { id: pret.id },
                data: {
                    nombreRetourne: { decrement: reprise },
                    // Un prêt soldé qui redevient partiel doit repasser EN_COURS,
                    // sinon il disparaîtrait des caisses réputées dehors.
                    ...(pret.statut === "RETOURNE" && { statut: "EN_COURS", dateRetour: null }),
                    updatedAt: new Date(),
                },
            });

            restant -= reprise;
        }

        const annule = aAnnuler - restant;
        if (annule > 0) annuleParType.set(typeCaisseId, annule);
    }

    // Les caisses ne sont finalement pas revenues : elles ressortent du stock.
    for (const [typeCaisseId, nombre] of annuleParType) {
        await tx.typeCaisse.updateMany({
            where: { id: typeCaisseId, tenantId },
            data: { stockDisponible: { decrement: nombre }, updatedAt: new Date() },
        });
    }

    return annuleParType;
}

/**
 * Supprime la livraison et défait ses effets, atomiquement.
 *
 * Ordre imposé par les clés étrangères : les enfants sans cascade d'abord, le
 * détachement des prêts ensuite, la livraison en dernier. `Pesee`,
 * `PeseeCaisse` et `LivraisonTypeCaisse` sont supprimées automatiquement par
 * la base (`onDelete: Cascade`).
 */
export async function supprimerLivraisonEnCascade(
    tenantId: string,
    livraisonId: string
) {
    return prisma.$transaction(async (tx) => {
        // Revérifié DANS la transaction : entre l'affichage de la confirmation
        // et le clic, une vente a pu consommer le stock.
        const motifs = await verifierSuppressionPossible(tenantId, livraisonId, tx);
        if (motifs.length > 0) {
            throw new LivraisonNonSupprimableError(motifs);
        }

        const livraison = await tx.livraison.findFirst({
            where: { id: livraisonId, tenantId },
            select: {
                id: true,
                numeroLot: true,
                agriculteurId: true,
                Pesee: { select: { typeCaisseId: true, caissesRetournees: true } },
            },
        });
        if (!livraison) {
            throw new Error("Livraison introuvable");
        }

        const caissesParType = new Map<string, number>();
        for (const p of livraison.Pesee) {
            if (p.caissesRetournees <= 0) continue;
            caissesParType.set(
                p.typeCaisseId,
                (caissesParType.get(p.typeCaisseId) ?? 0) + p.caissesRetournees
            );
        }
        const caissesAnnulees = await annulerRetoursCaisses(
            tx,
            tenantId,
            livraison.agriculteurId,
            caissesParType
        );

        await tx.bonAchat.deleteMany({ where: { livraisonId, tenantId } });
        await tx.stockDate.deleteMany({ where: { livraisonId, tenantId } });
        await tx.echantillon.deleteMany({ where: { livraisonId, tenantId } });

        // Un prêt de caisses est un fait physique indépendant : on le détache
        // de la livraison au lieu de le supprimer, sinon des caisses réellement
        // sorties disparaîtraient du suivi.
        await tx.pretCaisse.updateMany({
            where: { livraisonId, tenantId },
            data: { livraisonId: null },
        });

        await tx.livraison.delete({ where: { id: livraisonId } });

        return {
            numeroLot: livraison.numeroLot,
            peseesSupprimees: livraison.Pesee.length,
            caissesRetireesDuStock: Array.from(caissesAnnulees, ([typeCaisseId, nombre]) => ({
                typeCaisseId,
                nombre,
            })),
        };
    }, { timeout: 20000, maxWait: 10000 });
}
