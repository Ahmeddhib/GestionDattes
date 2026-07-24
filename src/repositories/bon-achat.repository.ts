import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const bonAchatRepository = {
    /**
     * Génère un numéro de bon d'achat unique pour le tenant (préfixe BA-<année>-)
     */
    async generateNumeroBonAchat(tenantId: string, client: DbClient = prisma): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `BA-${year}-`;

        const last = await client.bonAchat.findFirst({
            where: { tenantId, numero: { startsWith: prefix } },
            orderBy: { numero: "desc" },
        });

        let nextNumber = 1;
        if (last?.numero) {
            const lastNumber = parseInt(last.numero.split("-").pop() || "0");
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },

    async findByLivraisonId(livraisonId: string, tenantId: string, client: DbClient = prisma) {
        return client.bonAchat.findFirst({ where: { livraisonId, tenantId } });
    },

    async findAll(tenantId: string) {
        return prisma.bonAchat.findMany({
            where: { tenantId },
            include: {
                Livraison: { select: { id: true, numeroLot: true, dateLivraison: true } },
                User: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async findById(id: string, tenantId: string) {
        return prisma.bonAchat.findFirst({
            where: { id, tenantId },
            include: {
                Livraison: { select: { id: true, numeroLot: true, dateLivraison: true } },
                User: { select: { id: true, name: true } },
            },
        });
    },

    async create(
        data: {
            numero: string;
            prixKg: number;
            montant: number;
            observations?: string;
            livraisonId: string;
            createdById: string;
            tenantId: string;
        },
        client: DbClient = prisma
    ) {
        return client.bonAchat.create({
            data: {
                id: createId(),
                numero: data.numero,
                prixKg: data.prixKg,
                montant: data.montant,
                observations: data.observations,
                livraisonId: data.livraisonId,
                createdById: data.createdById,
                tenantId: data.tenantId,
                updatedAt: new Date(),
            },
        });
    },
};
