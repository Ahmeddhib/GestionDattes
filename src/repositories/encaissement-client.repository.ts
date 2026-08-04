import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { CreateEncaissementClientInput } from "@/validators/encaissement-client.validator";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Repository pour les encaissements enregistrés sur les ventes. Toutes les
 * méthodes filtrent par tenantId.
 */
export const encaissementClientRepository = {
    async findByVente(venteId: string, tenantId: string) {
        return prisma.encaissementClient.findMany({
            where: { venteId, tenantId },
            orderBy: { dateEncaissement: "desc" },
            include: {
                User: { select: { id: true, name: true } },
            },
        });
    },

    async findAll(tenantId: string) {
        return prisma.encaissementClient.findMany({
            where: { tenantId },
            orderBy: { dateEncaissement: "desc" },
            include: {
                User: { select: { id: true, name: true } },
                Vente: {
                    select: {
                        id: true,
                        Client: { select: { id: true, nom: true } },
                    },
                },
            },
        });
    },

    async getTotalEncaisseForVente(venteId: string, tenantId: string, client: DbClient = prisma) {
        const result = await client.encaissementClient.aggregate({
            where: { venteId, tenantId },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    /**
     * Enregistre un encaissement et recalcule le statut de la vente, de façon
     * atomique — même principe que paiementAgriculteurRepository.enregistrer /
     * pretCaisseRepository.retournerCaisses (relecture du total dans la même
     * transaction que l'écriture, pour éviter un dépassement concurrent).
     */
    async enregistrer(
        data: CreateEncaissementClientInput,
        tenantId: string,
        createdById: string,
        client: DbClient
    ) {
        const vente = await client.vente.findFirst({
            where: { id: data.venteId, tenantId },
        });

        if (!vente) {
            throw new Error("Vente introuvable dans cette Wakala");
        }

        if (vente.statut === "PAYE") {
            throw new Error("Cette vente est déjà entièrement réglée");
        }

        const totalEncaisse = await this.getTotalEncaisseForVente(data.venteId, tenantId, client);
        const montantRestant = vente.montant - totalEncaisse;

        if (data.montant > montantRestant) {
            throw new Error(
                `Impossible d'enregistrer ${data.montant.toFixed(2)}. Reste à payer: ${montantRestant.toFixed(2)}`
            );
        }

        const encaissement = await client.encaissementClient.create({
            data: {
                id: createId(),
                montant: data.montant,
                modePaiement: data.modePaiement || null,
                observations: data.observations || null,
                venteId: data.venteId,
                createdById,
                tenantId,
            },
        });

        const nouveauTotalEncaisse = totalEncaisse + data.montant;
        const nouveauStatut = nouveauTotalEncaisse >= vente.montant ? "PAYE" : "PARTIEL";

        const venteMiseAJour = await client.vente.update({
            where: { id: data.venteId },
            data: { statut: nouveauStatut },
        });

        return {
            encaissement,
            vente: venteMiseAJour,
            montantRestant: vente.montant - nouveauTotalEncaisse,
        };
    },
};
