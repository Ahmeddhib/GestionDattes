import { prisma } from "@/lib/prisma";

export const stockDateRepository = {
    async findAll(tenantId: string) {
        return prisma.stockDate.findMany({
            where: { tenantId },
            include: {
                TypeDate: { select: { id: true, nom: true } },
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        Agriculteur: { select: { id: true, nom: true, prenom: true, code: true } },
                    },
                },
            },
            orderBy: { dateEntree: "desc" },
        });
    },

    /**
     * Lots de stock disponibles à la vente (quantiteDisponible > 0),
     * niveau lot (une ligne par livraison/type de datte), pas agrégé par type.
     */
    async findAvailableLots(tenantId: string) {
        return prisma.stockDate.findMany({
            where: { tenantId, quantiteDisponible: { gt: 0 } },
            include: {
                TypeDate: { select: { id: true, nom: true } },
                Livraison: { select: { id: true, numeroLot: true } },
            },
            orderBy: { dateEntree: "asc" },
        });
    },

    async findById(tenantId: string, id: string) {
        return prisma.stockDate.findFirst({
            where: { id, tenantId },
        });
    },
};
