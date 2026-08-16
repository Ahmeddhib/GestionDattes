import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { saisonRepository } from "@/repositories/saison.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { findSaisonOuverte } from "@/lib/saison-guard";
import { ROUTES } from "@/lib/routes";
import { Prisma, type TypeBilanSaison } from "@/generated/prisma";
import { computeIndicateursSaison, type IndicateursSaison } from "./saison-bilan.service";

type DbClient = typeof prisma | Prisma.TransactionClient;

// Deux opérations bien distinctes vivent dans ce service :
//
//   - genererBilanProvisoire : fige un snapshot des indicateurs et NE TOUCHE
//     PAS au statut. Répétable autant de fois que voulu pendant la campagne.
//   - cloturerSaison : irréversible, crée le snapshot FINAL et passe la saison
//     en CLOTUREE.
//
// La clôture ne crée pas automatiquement la saison suivante : c'est à un ADMIN
// de la créer manuellement. Entre les deux, le tenant n'a aucune saison
// OUVERTE et getSaisonOuverte bloque proprement toute nouvelle opération —
// d'où le drapeau `prochaineSaisonRequise` renvoyé à l'UI.

export type ChecklistSeverity = "BLOCKING" | "WARNING";

export interface ChecklistItem {
    code: string;
    severity: ChecklistSeverity;
    /** Nombre d'éléments concernés, pour les contrôles qui comptent des lignes. */
    count?: number;
    /** Valeur déjà formatée (montant, quantité) pour les avertissements. */
    valeur?: string;
    /** Lien profond vers la liste concernée, pré-filtrée sur la saison. */
    href?: string;
}

/**
 * Erreur "attendue" : la saison n'est plus OUVERTE (déjà clôturée entre-temps,
 * ex. retour arrière du navigateur, double-clic). Les appelants la distinguent
 * des erreurs techniques pour éviter de la logger comme un crash.
 */
export class SaisonNonOuverteError extends Error {}

export interface AperçuCloture {
    saison: { id: string; nom: string; dateDebut: Date; dateFin: Date; statut: string };
    indicateurs: IndicateursSaison;
    blockers: ChecklistItem[];
    warnings: ChecklistItem[];
}

function fmtMontant(n: number) {
    return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
}

function fmtQuantite(n: number) {
    return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg`;
}

/**
 * Conditions BLOQUANTES de la clôture.
 *
 * Le schéma n'a aucune notion de brouillon : `Livraison` n'a pas de champ
 * statut du tout, et `StatutVente`/`StatutBonAchat` (EN_ATTENTE|PARTIEL|PAYE)
 * décrivent un état de PAIEMENT, pas de complétude. « Document incomplet » est
 * donc défini structurellement, pas par un statut — ne pas inventer un
 * StatutLivraison.
 *
 * Les deux prédicats ci-dessous sont ceux déjà utilisés par les alertes du
 * dashboard (dashboard.repository.ts), restreints à la saison.
 */
async function computeBlockers(
    tenantId: string,
    saisonId: string,
    client: DbClient = prisma
): Promise<ChecklistItem[]> {
    const [sansPesee, sansBonAchat] = await Promise.all([
        client.livraison.count({ where: { tenantId, saisonId, Pesee: { none: {} } } }),
        client.livraison.count({ where: { tenantId, saisonId, BonAchat: null } }),
    ]);

    const items: ChecklistItem[] = [];

    // Sans pesée, le poids net n'a jamais été établi : les quantités restent
    // déclaratives et tous les indicateurs aval sont faux.
    if (sansPesee > 0) {
        items.push({
            code: "LIVRAISON_SANS_PESEE",
            severity: "BLOCKING",
            count: sansPesee,
            href: `${ROUTES.LIVRAISONS}?saisonId=${saisonId}`,
        });
    }

    // Sans bon d'achat, l'achat n'a jamais été valorisé : la dette envers
    // l'agriculteur n'existe pas et la marge brute est surévaluée.
    if (sansBonAchat > 0) {
        items.push({
            code: "LIVRAISON_SANS_BON_ACHAT",
            severity: "BLOCKING",
            count: sansBonAchat,
            href: `${ROUTES.LIVRAISONS}?saisonId=${saisonId}`,
        });
    }

    return items;
}

/**
 * Avertissements NON bloquants. Ils dérivent des indicateurs déjà calculés
 * (zéro requête supplémentaire) plus deux comptages de statuts.
 *
 * Du stock restant ou des soldes ouverts ne sont pas des anomalies : c'est au
 * propriétaire de décider que la campagne est terminée.
 */
async function computeWarnings(
    tenantId: string,
    saisonId: string,
    indicateurs: IndicateursSaison,
    client: DbClient = prisma
): Promise<ChecklistItem[]> {
    const [bonsPartiels, ventesPartielles, bonsImpayes] = await Promise.all([
        client.bonAchat.count({ where: { tenantId, saisonId, statut: "PARTIEL" } }),
        client.vente.count({ where: { tenantId, saisonId, statut: "PARTIEL" } }),
        client.bonAchat.count({ where: { tenantId, saisonId, statut: "EN_ATTENTE" } }),
    ]);

    const items: ChecklistItem[] = [];

    if (indicateurs.soldeAgriculteursRestant > 0) {
        items.push({
            code: "DETTES_AGRICULTEURS_RESTANTES",
            severity: "WARNING",
            valeur: fmtMontant(indicateurs.soldeAgriculteursRestant),
            href: `${ROUTES.PAIEMENTS_AGRICULTEURS}?saisonId=${saisonId}`,
        });
    }

    if (indicateurs.creancesClientsRestantes > 0) {
        items.push({
            code: "CREANCES_CLIENTS_RESTANTES",
            severity: "WARNING",
            valeur: fmtMontant(indicateurs.creancesClientsRestantes),
            href: `${ROUTES.VENTES}?saisonId=${saisonId}`,
        });
    }

    // Volontairement calculé sur le total GLOBAL du tenant : des caisses
    // prêtées lors d'une campagne précédente et jamais rendues sont toujours
    // physiquement dehors, elles ne doivent pas disparaître de la checklist.
    const caissesDehors = indicateurs.stockCaisses.reduce((s, c) => s + c.nombreNonRetourne, 0);
    if (caissesDehors > 0) {
        items.push({
            code: "CAISSES_NON_RETOURNEES",
            severity: "WARNING",
            valeur: String(caissesDehors),
            href: ROUTES.STOCK_CAISSES,
        });
    }

    const stockRestant = indicateurs.stockFinalParTypeDate.reduce(
        (s, x) => s + x.quantiteDisponible,
        0
    );
    if (stockRestant > 0) {
        items.push({
            code: "STOCK_RESTANT",
            severity: "WARNING",
            valeur: fmtQuantite(stockRestant),
            href: ROUTES.STOCK_DATTES,
        });
    }

    if (bonsPartiels > 0) {
        items.push({ code: "PAIEMENTS_PARTIELS", severity: "WARNING", count: bonsPartiels });
    }
    if (ventesPartielles > 0) {
        items.push({ code: "ENCAISSEMENTS_PARTIELS", severity: "WARNING", count: ventesPartielles });
    }
    if (bonsImpayes > 0) {
        items.push({ code: "BONS_ACHAT_IMPAYES", severity: "WARNING", count: bonsImpayes });
    }

    return items;
}

async function chargerSaisonOuverte(tenantId: string, saisonId: string) {
    const saison = await saisonRepository.findById(tenantId, saisonId);
    if (!saison) {
        throw new Error("Saison introuvable dans cette Wakala");
    }
    if (saison.statut !== "OUVERTE") {
        throw new SaisonNonOuverteError(`La saison "${saison.nom}" est déjà clôturée`);
    }
    return saison;
}

/**
 * Crée un snapshot immuable. La version est une séquence monotone par saison,
 * partagée par les provisoires et le final (provisoire v1, v2 … final vN).
 */
async function creerSnapshot(
    tx: Prisma.TransactionClient,
    tenantId: string,
    saisonId: string,
    userId: string,
    type: TypeBilanSaison,
    indicateurs: IndicateursSaison
) {
    const agg = await tx.bilanSaison.aggregate({
        where: { saisonId },
        _max: { version: true },
    });

    return tx.bilanSaison.create({
        data: {
            id: createId(),
            saisonId,
            tenantId,
            type,
            version: (agg._max.version ?? 0) + 1,
            genereParId: userId,
            ...indicateurs,
            stockFinalParTypeDate: indicateurs.stockFinalParTypeDate as unknown as Prisma.InputJsonValue,
            stockCaisses: indicateurs.stockCaisses as unknown as Prisma.InputJsonValue,
            stockEntreParTypeDate: indicateurs.stockEntreParTypeDate as unknown as Prisma.InputJsonValue,
            stockOrigineRestantParTypeDate:
                indicateurs.stockOrigineRestantParTypeDate as unknown as Prisma.InputJsonValue,
            caissesSaison: indicateurs.caissesSaison as unknown as Prisma.InputJsonValue,
        },
    });
}

/** Vrai si l'erreur est la violation d'unicité (saisonId, version). */
function isVersionConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const saisonClotureService = {
    /**
     * Tous les bilans d'une saison, du plus récent au plus ancien (lecture
     * pure, jamais recalculée).
     */
    async listBilans(tenantId: string, saisonId: string) {
        await requirePermission("saison:read");
        return prisma.bilanSaison.findMany({
            where: { saisonId, tenantId },
            orderBy: { version: "desc" },
            include: { User: { select: { name: true, email: true } } },
        });
    },

    /**
     * Le bilan de clôture figé. Le filtre `type: "FINAL"` est indispensable :
     * sans lui, un bilan provisoire plus récent serait renvoyé à sa place.
     */
    async getBilanFinal(tenantId: string, saisonId: string) {
        await requirePermission("saison:read");
        return prisma.bilanSaison.findFirst({ where: { saisonId, tenantId, type: "FINAL" } });
    },

    /**
     * Fige un bilan PROVISOIRE. N'affecte jamais le statut de la saison :
     * l'utilisateur peut continuer à recevoir des livraisons, vendre, payer,
     * puis en générer un autre.
     */
    async genererBilanProvisoire(tenantId: string, saisonId: string, userId: string) {
        await requirePermission("saison:bilan-provisoire");

        const saison = await chargerSaisonOuverte(tenantId, saisonId);

        const executer = () =>
            prisma.$transaction(
                async (tx) => {
                    const indicateurs = await computeIndicateursSaison(tenantId, saisonId, tx);
                    const bilan = await creerSnapshot(
                        tx,
                        tenantId,
                        saisonId,
                        userId,
                        "PROVISOIRE",
                        indicateurs
                    );

                    await auditService.log(
                        {
                            tenantId,
                            actorId: userId,
                            action: "GENERER_BILAN_PROVISOIRE",
                            targetId: saisonId,
                            description: `Bilan provisoire v${bilan.version} généré pour la saison ${saison.nom}`,
                            details: {
                                bilanId: bilan.id,
                                version: bilan.version,
                                tresorerie: indicateurs.tresorerie,
                                margeNette: indicateurs.margeNette,
                            },
                        },
                        tx
                    );

                    return bilan;
                },
                { timeout: 20000, maxWait: 10000 }
            );

        try {
            return await executer();
        } catch (error) {
            // Deux générations simultanées peuvent lire le même numéro de
            // version. Un seul retry suffit : la seconde relira le max à jour.
            if (isVersionConflict(error)) return executer();
            throw error;
        }
    },

    async getAperçuCloture(tenantId: string, saisonId: string): Promise<AperçuCloture> {
        await requirePermission("saison:cloturer");

        const saison = await chargerSaisonOuverte(tenantId, saisonId);
        const indicateurs = await computeIndicateursSaison(tenantId, saisonId);
        const [blockers, warnings] = await Promise.all([
            computeBlockers(tenantId, saisonId),
            computeWarnings(tenantId, saisonId, indicateurs),
        ]);

        return {
            saison: {
                id: saison.id,
                nom: saison.nom,
                dateDebut: saison.dateDebut,
                dateFin: saison.dateFin,
                statut: saison.statut,
            },
            indicateurs,
            blockers,
            warnings,
        };
    },

    /**
     * Clôture définitive. Irréversible : une saison CLOTUREE n'est jamais
     * rouverte, et ses documents deviennent en lecture seule via
     * `assertSaisonOuverte`.
     */
    async cloturerSaison(tenantId: string, saisonId: string, userId: string) {
        await requirePermission("saison:cloturer");

        await chargerSaisonOuverte(tenantId, saisonId);

        const result = await prisma.$transaction(
            async (tx) => {
                // Revalidation DANS la transaction : l'aperçu vu par le client
                // peut dater, et le contrôle hors transaction laisserait une
                // fenêtre pendant laquelle une livraison incomplète est créée.
                const blockers = await computeBlockers(tenantId, saisonId, tx);
                if (blockers.length > 0) {
                    throw new Error(
                        `Impossible de clôturer cette saison : ${blockers.length} point(s) bloquant(s) subsistent.`
                    );
                }

                const indicateurs = await computeIndicateursSaison(tenantId, saisonId, tx);
                const bilanFinal = await creerSnapshot(
                    tx,
                    tenantId,
                    saisonId,
                    userId,
                    "FINAL",
                    indicateurs
                );

                const saisonCloturee = await tx.saison.update({
                    where: { id: saisonId },
                    data: {
                        statut: "CLOTUREE",
                        clotureeAt: new Date(),
                        clotureeParId: userId,
                        updatedAt: new Date(),
                    },
                });

                await auditService.log(
                    {
                        tenantId,
                        actorId: userId,
                        action: "CLOTURER_SAISON",
                        targetId: saisonId,
                        description: `Saison clôturée: ${saisonCloturee.nom}`,
                        details: {
                            saisonClotureeId: saisonId,
                            bilanId: bilanFinal.id,
                            version: bilanFinal.version,
                            tresorerie: indicateurs.tresorerie,
                            margeBrute: indicateurs.margeBrute,
                            margeNette: indicateurs.margeNette,
                        },
                    },
                    tx
                );

                return { saisonCloturee, bilanFinal };
            },
            { timeout: 20000, maxWait: 10000 }
        );

        // La saison suivante n'est pas créée automatiquement : on signale
        // simplement à l'UI qu'il faut inviter un ADMIN à le faire.
        const saisonOuverte = await findSaisonOuverte(tenantId);

        return { ...result, prochaineSaisonRequise: saisonOuverte === null };
    },
};
