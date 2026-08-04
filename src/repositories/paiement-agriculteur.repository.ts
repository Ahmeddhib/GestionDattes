import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { CreatePaiementAgriculteurInput } from "@/validators/paiement-agriculteur.validator";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Repository pour les paiements (avances/règlements) enregistrés sur les
 * bons d'achat. Toutes les méthodes filtrent par tenantId.
 */
export const paiementAgriculteurRepository = {
    /**
     * Historique des paiements d'un bon d'achat, du plus récent au plus ancien.
     */
    async findByBonAchat(bonAchatId: string, tenantId: string) {
        return prisma.paiementAgriculteur.findMany({
            where: { bonAchatId, tenantId },
            orderBy: { datePaiement: "desc" },
            include: {
                User: { select: { id: true, name: true } },
            },
        });
    },

    /**
     * Historique complet des paiements du tenant (page Finance).
     */
    async findAll(tenantId: string) {
        return prisma.paiementAgriculteur.findMany({
            where: { tenantId },
            orderBy: { datePaiement: "desc" },
            include: {
                User: { select: { id: true, name: true } },
                BonAchat: {
                    select: {
                        id: true,
                        numero: true,
                        Livraison: {
                            select: {
                                Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
                            },
                        },
                    },
                },
            },
        });
    },

    /**
     * Total déjà payé sur un bon d'achat (agrégat, jamais persisté).
     */
    async getTotalPaidForBonAchat(bonAchatId: string, tenantId: string, client: DbClient = prisma) {
        const result = await client.paiementAgriculteur.aggregate({
            where: { bonAchatId, tenantId },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    /**
     * Enregistre un paiement et recalcule le statut du bon d'achat, de façon
     * atomique : le total déjà payé est relu avec le même client (transaction)
     * que l'écriture, pour éviter qu'un paiement concurrent ne fasse dépasser
     * le montant dû (TOCTOU) — même principe que
     * pretCaisseRepository.retournerCaisses.
     */
    async enregistrer(
        data: CreatePaiementAgriculteurInput,
        tenantId: string,
        createdById: string,
        client: DbClient
    ) {
        const bonAchat = await client.bonAchat.findFirst({
            where: { id: data.bonAchatId, tenantId },
        });

        if (!bonAchat) {
            throw new Error("Bon d'achat introuvable dans cette Wakala");
        }

        if (bonAchat.statut === "PAYE") {
            throw new Error("Ce bon d'achat est déjà entièrement réglé");
        }

        const totalPaye = await this.getTotalPaidForBonAchat(data.bonAchatId, tenantId, client);
        const montantRestant = bonAchat.montant - totalPaye;

        if (data.montant > montantRestant) {
            throw new Error(
                `Impossible d'enregistrer ${data.montant.toFixed(2)}. Reste à payer: ${montantRestant.toFixed(2)}`
            );
        }

        const paiement = await client.paiementAgriculteur.create({
            data: {
                id: createId(),
                montant: data.montant,
                modePaiement: data.modePaiement || null,
                observations: data.observations || null,
                bonAchatId: data.bonAchatId,
                createdById,
                tenantId,
            },
        });

        const nouveauTotalPaye = totalPaye + data.montant;
        const nouveauStatut = nouveauTotalPaye >= bonAchat.montant ? "PAYE" : "PARTIEL";

        const bonAchatMisAJour = await client.bonAchat.update({
            where: { id: data.bonAchatId },
            data: { statut: nouveauStatut, updatedAt: new Date() },
        });

        return {
            paiement,
            bonAchat: bonAchatMisAJour,
            montantRestant: bonAchat.montant - nouveauTotalPaye,
        };
    },
};
