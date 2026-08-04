import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { CreateDepenseInput, UpdateDepenseInput } from "@/validators/depense-autre.validator";

export const depenseAutreRepository = {
    async findAll(tenantId: string) {
        return prisma.depenseAutre.findMany({
            where: { tenantId },
            orderBy: { dateDepense: "desc" },
            include: {
                User: { select: { id: true, name: true } },
            },
        });
    },

    async findById(tenantId: string, id: string) {
        return prisma.depenseAutre.findFirst({
            where: { id, tenantId },
        });
    },

    async create(tenantId: string, createdById: string, data: CreateDepenseInput) {
        return prisma.depenseAutre.create({
            data: {
                id: createId(),
                tenantId,
                createdById,
                libelle: data.libelle,
                montant: data.montant,
                categorie: data.categorie || null,
                dateDepense: data.dateDepense ?? new Date(),
                observations: data.observations || null,
                updatedAt: new Date(),
            },
        });
    },

    async update(tenantId: string, data: UpdateDepenseInput) {
        const existing = await this.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }

        return prisma.depenseAutre.update({
            where: { id: data.id },
            data: {
                libelle: data.libelle,
                montant: data.montant,
                categorie: data.categorie || null,
                dateDepense: data.dateDepense ?? existing.dateDepense,
                observations: data.observations || null,
                updatedAt: new Date(),
            },
        });
    },

    async delete(tenantId: string, id: string) {
        const existing = await this.findById(tenantId, id);
        if (!existing) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }
        return prisma.depenseAutre.delete({ where: { id } });
    },

    /**
     * Total des dépenses sur une période (utilisé par le bilan financier).
     */
    async getTotal(tenantId: string, dateFrom?: Date, dateTo?: Date) {
        const result = await prisma.depenseAutre.aggregate({
            where: {
                tenantId,
                ...(dateFrom || dateTo
                    ? { dateDepense: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } }
                    : {}),
            },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },
};
