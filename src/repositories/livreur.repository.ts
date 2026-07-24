import { prisma } from "@/lib/prisma";
import type { CreateLivreurInput, UpdateLivreurInput } from "@/validators/livreur.validator";

const nullIfEmpty = (value?: string | null) => value?.trim() || null;

export const livreurRepository = {
    findAll(tenantId: string) {
        return prisma.livreur.findMany({ where: { tenantId }, orderBy: { nom: "asc" } });
    },

    findById(tenantId: string, id: string) {
        return prisma.livreur.findFirst({ where: { id, tenantId } });
    },

    create(tenantId: string, data: CreateLivreurInput) {
        return prisma.livreur.create({
            data: {
                tenantId,
                nom: data.nom.trim(),
                telephone: nullIfEmpty(data.telephone),
                cin: nullIfEmpty(data.cin),
                vehicule: nullIfEmpty(data.vehicule),
                active: data.active,
            },
        });
    },

    async update(tenantId: string, data: UpdateLivreurInput) {
        const existing = await this.findById(tenantId, data.id);
        if (!existing) throw new Error("Livreur introuvable dans cette Wakala");

        return prisma.livreur.update({
            where: { id: data.id },
            data: {
                nom: data.nom.trim(),
                telephone: nullIfEmpty(data.telephone),
                cin: nullIfEmpty(data.cin),
                vehicule: nullIfEmpty(data.vehicule),
                active: data.active,
            },
        });
    },

    async delete(tenantId: string, id: string) {
        const existing = await this.findById(tenantId, id);
        if (!existing) throw new Error("Livreur introuvable dans cette Wakala");
        return prisma.livreur.delete({ where: { id } });
    },
};
