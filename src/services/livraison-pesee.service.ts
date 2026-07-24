import { prisma } from "@/lib/prisma";
import { livraisonRepository } from "@/repositories/livraison.repository";
import { peseeRepository } from "@/repositories/pesee.repository";
import { bonAchatRepository } from "@/repositories/bon-achat.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { typeDateRepository } from "@/repositories/type-date.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { auditService } from "./audit.service";
import { computeTotals, retournerCaissesAutomatiquement } from "./pesee.service";
import { requirePermission } from "@/lib/permissions";
import { buildPeseeCaisseSchema } from "@/validators/pesee.validator";
import type { CreerLivraisonAvecPeseesInput } from "@/validators/livraison-pesee.validator";

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

        // Revalider chaque ligne contre les vraies données serveur (jamais confiance au client)
        const resolved = await Promise.all(
            data.lignes.map(async (ligne) => {
                const typeDate = await typeDateRepository.findById(ligne.typeDateId, tenantId);
                if (!typeDate) {
                    throw new Error(`Type de datte introuvable: ${ligne.typeDateId}`);
                }
                const typeCaisse = await typeCaisseRepository.findById(tenantId, ligne.typeCaisseId);
                if (!typeCaisse) {
                    throw new Error(`Type de caisse introuvable: ${ligne.typeCaisseId}`);
                }

                const caisseSchema = buildPeseeCaisseSchema(typeCaisse.poidsKg);
                const validatedCaisses = ligne.caisses.map((c) => caisseSchema.parse(c));
                const grossWeights = validatedCaisses.map((c) => c.poidsBrut);
                const totals = computeTotals(typeCaisse.poidsKg, grossWeights);

                return {
                    typeDateId: ligne.typeDateId,
                    typeCaisseId: ligne.typeCaisseId,
                    quantiteDeclaree: ligne.quantiteDeclaree,
                    typeCaisse,
                    typeDate,
                    grossWeights,
                    totals,
                };
            })
        );

        const numeroLot = await livraisonRepository.generateNumeroLot(tenantId);
        const quantiteLivreeTotal = resolved.reduce(
            (sum, r) => sum + r.totals.poidsNetTotal.toNumber(),
            0
        );
        const quantiteAcceptee = data.quantiteAcceptee ?? quantiteLivreeTotal;

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
                tx
            );

            for (const r of resolved) {
                const pesee = await peseeRepository.create(
                    tenantId,
                    livraison.id,
                    r.typeCaisseId,
                    r.typeDateId,
                    r.typeCaisse.poidsKg,
                    r.grossWeights,
                    r.totals,
                    tx
                );

                await retournerCaissesAutomatiquement(
                    tx,
                    tenantId,
                    data.agriculteurId,
                    r.typeCaisseId,
                    r.totals.nombreCaisses,
                    numeroLot
                );

                await auditService.log(
                    {
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
                    },
                    tx
                );
            }

            const numeroBonAchat = await bonAchatRepository.generateNumeroBonAchat(tenantId, tx);
            const montant = data.prixKg * quantiteAcceptee;
            const bonAchat = await bonAchatRepository.create(
                {
                    numero: numeroBonAchat,
                    prixKg: data.prixKg,
                    montant,
                    observations: data.observations,
                    livraisonId: livraison.id,
                    createdById: userId,
                    tenantId,
                },
                tx
            );

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_BON_ACHAT",
                    targetId: bonAchat.id,
                    description: `Bon d'achat ${numeroBonAchat} généré pour la livraison ${numeroLot}`,
                    details: { numero: numeroBonAchat, prixKg: data.prixKg, montant },
                },
                tx
            );

            await auditService.log(
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
                },
                tx
            );

            return { livraison, bonAchat };
        }, { timeout: 20000, maxWait: 10000 });

        return result;
    },
};
