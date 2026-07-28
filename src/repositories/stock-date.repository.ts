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
};
