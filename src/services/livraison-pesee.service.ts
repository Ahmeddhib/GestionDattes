import { prisma } from "@/lib/prisma";
import { livraisonRepository } from "@/repositories/livraison.repository";
import { peseeRepository } from "@/repositories/pesee.repository";
import { bonAchatRepository } from "@/repositories/bon-achat.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { auditService } from "./audit.service";
import { resolveLignesPesee, retournerCaissesAutomatiquement, syncLivraisonWithPesees } from "./pesee.service";
import { requirePermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import type {
    CreerLivraisonAvecPeseesInput,
    MettreAJourLivraisonAvecPeseesInput,
} from "@/validators/livraison-pesee.validator";

export const livraisonPeseeService = {
    /**
     * Crée une livraison, ses pesées et son bon d'achat en une seule fois,
     * atomiquement : l'utilisateur pèse d'abord les caisses déclarées, et la
     * livraison + le stock + le bon d'achat sont générés automatiquement à
     * partir des poids réels.
     */
    async creer(tenantId: string, userId: string, data: CreerLivraisonAvecPeseesInput) {
        await requirePermission("livraison:create");
        await requirePermission("pesee:create");
        await requirePermission("bon-achat:create");

        const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Toute nouvelle livraison est automatiquement rattachée à la saison
        // ouverte du tenant — jamais choisie par l'utilisateur.
        const saison = await getSaisonOuverte(tenantId);

        // Revalider chaque ligne contre les vraies données serveur (jamais confiance au client)
        const resolved = await resolveLignesPesee(tenantId, data.lignes);

        const numeroLot = await livraisonRepository.generateNumeroLot(tenantId);
        // Le stock (quantiteLivree/StockDate) se base toujours sur le poids net
        // réellement mesuré — jamais sur la quantité acceptée négociée.
        const quantiteLivreeTotal = resolved.reduce(
            (sum, r) => sum + r.totals.poidsNetTotal.toNumber(),
            0
        );
        // La quantité acceptée globale n'est qu'une somme d'information : chaque
        // ligne porte sa propre quantité acceptée (négociée), utilisée pour le
        // montant du bon d'achat.
        const quantiteAcceptee = resolved.reduce((sum, r) => sum + r.quantiteAcceptee, 0);
        const montantTotal = resolved.reduce(
            (sum, r) => sum + r.prixKg * r.quantiteAcceptee,
            0
        );
        const prixKgMoyen = quantiteAcceptee > 0 ? montantTotal / quantiteAcceptee : 0;

        const result = await prisma.$transaction(async (tx) => {
            const stockGroups = new Map<string, number>();
            for (const r of resolved) {
                stockGroups.set(
                    r.typeDateId,
                    (stockGroups.get(r.typeDateId) ?? 0) + r.totals.poidsNetTotal.toNumber()
                );
            }

            const livraison = await livraisonRepository.create(
                {
                    agriculteurId: data.agriculteurId,
                    dateLivraison: data.dateLivraison,
                    quantiteLivree: quantiteLivreeTotal,
                    quantiteAcceptee,
                    caisses: resolved.map((r) => ({
                        typeCaisseId: r.typeCaisseId,
                        typeDateId: r.typeDateId,
                        quantite: r.quantiteDeclaree,
                    })),
                },
                tenantId,
                numeroLot,
                Array.from(stockGroups, ([typeDateId, quantite]) => ({ typeDateId, quantite })),
                saison.id,
                tx
            );

            // Les entrées d'audit sont accumulées puis écrites en une seule
            // instruction à la fin : une écriture par itération multipliait les
            // allers-retours sans rien apporter, le journal n'étant jamais relu
            // dans la foulée.
            const entreesAudit: Parameters<typeof auditService.logMany>[0] = [];

            for (const r of resolved) {
                // Le retour de caisses est fait AVANT la pesée pour que son
                // résultat exact soit consigné dessus : c'est cette trace qui
                // permet d'annuler le retour à l'identique si la livraison est
                // supprimée plus tard.
                const caissesRetournees = await retournerCaissesAutomatiquement(
                    tx,
                    tenantId,
                    data.agriculteurId,
                    r.typeCaisseId,
                    r.totals.nombreCaisses,
                    numeroLot
                );

                const pesee = await peseeRepository.create(
                    tenantId,
                    livraison.id,
                    data.agriculteurId,
                    r.typeCaisseId,
                    r.typeDateId,
                    r.typeCaisse.poidsKg,
                    r.grossWeights,
                    r.totals,
                    r.prixKg,
                    r.quantiteAcceptee,
                    tx,
                    caissesRetournees
                );

                entreesAudit.push({
                    tenantId,
                    actorId: userId,
                    action: "CREATE_PESEE",
                    targetId: pesee.id,
                    description: `Pesée créée (assistant) pour la livraison ${numeroLot} (${r.typeCaisse.nom} / ${r.typeDate.nom})`,
                    details: {
                        typeCaisse: r.typeCaisse.nom,
                        typeDate: r.typeDate.nom,
                        nombreCaisses: r.totals.nombreCaisses,
                        poidsNetTotal: r.totals.poidsNetTotal.toNumber(),
                    },
                });
            }

            const numeroBonAchat = await bonAchatRepository.generateNumeroBonAchat(tenantId, tx);
            const bonAchat = await bonAchatRepository.create(
                {
                    numero: numeroBonAchat,
                    prixKg: prixKgMoyen,
                    montant: montantTotal,
                    observations: data.observations,
                    livraisonId: livraison.id,
                    saisonId: saison.id,
                    createdById: userId,
                    tenantId,
                },
                tx
            );

            entreesAudit.push(
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_BON_ACHAT",
                    targetId: bonAchat.id,
                    description: `Bon d'achat ${numeroBonAchat} généré pour la livraison ${numeroLot}`,
                    details: { numero: numeroBonAchat, prixKgMoyen, montant: montantTotal },
                },
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_LIVRAISON",
                    targetId: livraison.id,
                    description: `Livraison créée via l'assistant de pesée: ${numeroLot} - ${agriculteur.nom} ${agriculteur.prenom}`,
                    details: {
                        numeroLot,
                        agriculteur: `${agriculteur.nom} ${agriculteur.prenom}`,
                        lignes: resolved.length,
                        quantiteLivreeTotal,
                    },
                }
            );

            await auditService.logMany(entreesAudit, tx);

            return { livraison, bonAchat };
        }, { timeout: 20000, maxWait: 10000 });

        return result;
    },

    /**
     * Resynchronise une livraison déjà pesée : les lignes (type datte/caisse +
     * poids réels) sont revalidées et recalculées avec la même logique que la
     * création (resolveLignesPesee), puis répercutées sur les Pesee associées,
     * le StockDate et le montant du BonAchat. Une Pesee n'est jamais éditée
     * manuellement — seule cette resynchronisation automatique la modifie.
     */
    async mettreAJour(
        tenantId: string,
        userId: string,
        livraisonId: string,
        data: MettreAJourLivraisonAvecPeseesInput
    ) {
        await requirePermission("livraison:update");
        await requirePermission("pesee:update");

        const existing = await livraisonRepository.findById(livraisonId, tenantId);
        if (!existing) {
            throw new Error("Livraison introuvable dans cette Wakala");
        }

        await assertSaisonOuverte(tenantId, existing.saisonId);

        const agriculteurId = data.agriculteurId ?? existing.agriculteurId;
        const agriculteur = await agriculteurRepository.findById(tenantId, agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        const resolved = await resolveLignesPesee(tenantId, data.lignes);

        const result = await prisma.$transaction(async (tx) => {
            await livraisonRepository.update(
                livraisonId,
                {
                    dateLivraison: data.dateLivraison,
                    agriculteurId,
                    // Recalculés juste après par syncLivraisonWithPesees à partir des Pesee réelles.
                    quantiteLivree: existing.quantiteLivree,
                    quantiteAcceptee: existing.quantiteAcceptee,
                    caisses: resolved.map((r) => ({
                        typeCaisseId: r.typeCaisseId,
                        typeDateId: r.typeDateId,
                        quantite: r.quantiteDeclaree,
                    })),
                },
                tenantId,
                tx
            );

            for (const r of resolved) {
                await peseeRepository.upsertForLigne(
                    tenantId,
                    livraisonId,
                    agriculteurId,
                    r.typeCaisseId,
                    r.typeDateId,
                    r.typeCaisse.poidsKg,
                    r.grossWeights,
                    r.totals,
                    r.prixKg,
                    r.quantiteAcceptee,
                    tx
                );
            }

            await peseeRepository.deleteObsoleteLignes(
                tenantId,
                livraisonId,
                resolved.map((r) => ({ typeCaisseId: r.typeCaisseId, typeDateId: r.typeDateId })),
                tx
            );

            // Recalcule Livraison.quantiteLivree/quantiteAcceptee et StockDate
            // (par type de datte) à partir des Pesee désormais à jour — logique
            // déjà utilisée par la pesée manuelle historique, ici réutilisée telle quelle.
            await syncLivraisonWithPesees(tx, tenantId, livraisonId);

            const livraisonAJour = await tx.livraison.findFirst({
                where: { id: livraisonId, tenantId },
                select: { quantiteAcceptee: true, numeroLot: true },
            });
            if (!livraisonAJour) {
                throw new Error("Livraison introuvable après resynchronisation");
            }

            const bonAchat = await bonAchatRepository.findByLivraisonId(livraisonId, tenantId, tx);
            if (bonAchat) {
                const quantiteAccepteeTotal = resolved.reduce((sum, r) => sum + r.quantiteAcceptee, 0);
                const montant = resolved.reduce(
                    (sum, r) => sum + r.prixKg * r.quantiteAcceptee,
                    0
                );
                const prixKg = quantiteAccepteeTotal > 0 ? montant / quantiteAccepteeTotal : bonAchat.prixKg;
                await bonAchatRepository.update(
                    bonAchat.id,
                    { prixKg, montant, observations: data.observations ?? bonAchat.observations ?? undefined },
                    tx
                );

                await auditService.log(
                    {
                        tenantId,
                        actorId: userId,
                        action: "UPDATE_BON_ACHAT",
                        targetId: bonAchat.id,
                        description: `Bon d'achat ${bonAchat.numero} recalculé après modification de la livraison ${livraisonAJour.numeroLot}`,
                        details: { prixKg, montant },
                    },
                    tx
                );
            }

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "UPDATE_LIVRAISON",
                    targetId: livraisonId,
                    description: `Livraison ${livraisonAJour.numeroLot} modifiée via l'assistant de pesée (${agriculteur.nom} ${agriculteur.prenom})`,
                    details: {
                        numeroLot: livraisonAJour.numeroLot,
                        lignes: resolved.length,
                    },
                },
                tx
            );

            return { id: livraisonId, numeroLot: livraisonAJour.numeroLot };
        }, { timeout: 20000, maxWait: 10000 });

        return result;
    },
};
