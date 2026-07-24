import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";

type DbClient = typeof prisma | Prisma.TransactionClient;

export interface PeseeTotals {
    nombreCaisses: number;
    poidsBrutTotal: Prisma.Decimal;
    poidsTareTotal: Prisma.Decimal;
    poidsNetTotal: Prisma.Decimal;
    poidsBrutMoyen: Prisma.Decimal;
    poidsNetMoyen: Prisma.Decimal;
}

const peseeInclude = {
    Livraison: {
        select: {
            id: true,
            numeroLot: true,
            dateLivraison: true,
            Agriculteur: {
                select: { id: true, code: true, nom: true, prenom: true },
            },
        },
    },
    TypeCaisse: {
        select: { id: true, nom: true },
    },
    TypeDate: {
        select: { id: true, nom: true },
    },
    Caisses: {
        orderBy: { ordre: "asc" as const },
    },
};

/**
 * Repository pour gérer les pesées par type de caisse (une session de pesée par
 * type de caisse et par livraison, avec le détail de chaque caisse individuelle)
 */
export const peseeRepository = {
    async findAll(tenantId: string) {
        return prisma.pesee.findMany({
            where: { tenantId },
            include: peseeInclude,
            orderBy: { createdAt: "desc" },
        });
    },

    async findById(tenantId: string, id: string) {
        return prisma.pesee.findFirst({
            where: { id, tenantId },
            include: peseeInclude,
        });
    },

    async findByLivraisonId(tenantId: string, livraisonId: string) {
        return prisma.pesee.findMany({
            where: { livraisonId, tenantId },
            include: peseeInclude,
            orderBy: { createdAt: "asc" },
        });
    },

    async findByLivraisonTypeCaisseAndTypeDate(
        tenantId: string,
        livraisonId: string,
        typeCaisseId: string,
        typeDateId: string
    ) {
        return prisma.pesee.findFirst({
            where: { livraisonId, typeCaisseId, typeDateId, tenantId },
        });
    },

    /**
     * Crée une session de pesée avec toutes ses caisses en une seule écriture atomique
     */
    async create(
        tenantId: string,
        livraisonId: string,
        typeCaisseId: string,
        typeDateId: string,
        tareKg: number,
        grossWeights: number[],
        totals: PeseeTotals,
        client: DbClient = prisma
    ) {
        return client.pesee.create({
            data: {
                id: createId(),
                tenantId,
                livraisonId,
                typeCaisseId,
                typeDateId,
                tareKg,
                nombreCaisses: totals.nombreCaisses,
                poidsBrutTotal: totals.poidsBrutTotal,
                poidsTareTotal: totals.poidsTareTotal,
                poidsNetTotal: totals.poidsNetTotal,
                poidsBrutMoyen: totals.poidsBrutMoyen,
                poidsNetMoyen: totals.poidsNetMoyen,
                createdAt: new Date(),
                Caisses: {
                    create: grossWeights.map((poidsBrut, index) => ({
                        id: createId(),
                        poidsBrut,
                        ordre: index + 1,
                    })),
                },
            },
            include: peseeInclude,
        });
    },

    /**
     * Remplace les caisses d'une session de pesée existante et recalcule ses totaux
     */
    async update(
        tenantId: string,
        id: string,
        tareKg: number,
        grossWeights: number[],
        totals: PeseeTotals,
        client: DbClient = prisma
    ) {
        const existing = await client.pesee.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return client.pesee.update({
            where: { id },
            data: {
                tareKg,
                nombreCaisses: totals.nombreCaisses,
                poidsBrutTotal: totals.poidsBrutTotal,
                poidsTareTotal: totals.poidsTareTotal,
                poidsNetTotal: totals.poidsNetTotal,
                poidsBrutMoyen: totals.poidsBrutMoyen,
                poidsNetMoyen: totals.poidsNetMoyen,
                Caisses: {
                    deleteMany: {},
                    create: grossWeights.map((poidsBrut, index) => ({
                        id: createId(),
                        poidsBrut,
                        ordre: index + 1,
                    })),
                },
            },
            include: peseeInclude,
        });
    },

    async delete(tenantId: string, id: string, client: DbClient = prisma) {
        const existing = await client.pesee.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return client.pesee.delete({ where: { id } });
    },

    async count(tenantId: string) {
        return prisma.pesee.count({ where: { tenantId } });
    },
};
