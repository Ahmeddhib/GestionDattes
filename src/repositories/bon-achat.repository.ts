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

    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.bonAchat.findMany({
            where: { tenantId, ...(opts?.saisonId && { saisonId: opts.saisonId }) },
            include: {
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                        Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
                        Pesee: {
                            select: {
                                id: true,
                                prixKg: true,
                                quantiteAcceptee: true,
                                poidsNetTotal: true,
                                TypeDate: { select: { id: true, nom: true } },
                                TypeCaisse: { select: { id: true, nom: true } },
                            },
                        },
                    },
                },
                User: { select: { id: true, name: true } },
                PaiementAgriculteur: { select: { montant: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async findById(id: string, tenantId: string) {
        return prisma.bonAchat.findFirst({
            where: { id, tenantId },
            include: {
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                        Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
                    },
                },
                User: { select: { id: true, name: true } },
                PaiementAgriculteur: { select: { montant: true } },
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
            saisonId: string;
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
                saisonId: data.saisonId,
                createdById: data.createdById,
                tenantId: data.tenantId,
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Recalcule prixKg/montant/observations d'un bon d'achat existant, appelé
     * automatiquement lors de la resynchronisation d'une livraison modifiée.
     */
    async update(
        id: string,
        data: { prixKg?: number; montant: number; observations?: string },
        client: DbClient = prisma
    ) {
        return client.bonAchat.update({
            where: { id },
            data: {
                ...(data.prixKg !== undefined && { prixKg: data.prixKg }),
                montant: data.montant,
                ...(data.observations !== undefined && { observations: data.observations }),
                updatedAt: new Date(),
            },
        });
    },
};
