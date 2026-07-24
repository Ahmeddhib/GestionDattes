import { prisma } from "@/lib/prisma";
import type { CreateTypeDateInput, UpdateTypeDateInput } from "@/validators/type-date.validator";

/**
 * Repository pour la gestion des types de dattes (multi-tenant)
 */
export const typeDateRepository = {
    /**
     * Récupère tous les types de dattes d'un tenant avec statistiques d'utilisation
     */
    async findAll(tenantId: string) {
        return prisma.typeDate.findMany({
            where: { tenantId },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        StockDate: true,
                    },
                },
            },
            orderBy: { nom: "asc" },
        });
    },

    /**
     * Récupère un type de datte par son ID (avec vérification tenant)
     */
    async findById(id: string, tenantId: string) {
        return prisma.typeDate.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        StockDate: true,
                    },
                },
            },
        });
    },

    /**
     * Vérifie si un type de datte existe par son nom (dans le tenant)
     */
    async existsByNom(nom: string, tenantId: string, excludeId?: string) {
        const where: any = { nom, tenantId };
        if (excludeId) {
            where.id = { not: excludeId };
        }
        const count = await prisma.typeDate.count({ where });
        return count > 0;
    },

    /**
     * Crée un nouveau type de datte
     */
    async create(data: CreateTypeDateInput, tenantId: string) {
        return prisma.typeDate.create({
            data: {
                id: `typedate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                nom: data.nom,
                description: data.description || null,
                tenantId,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Met à jour un type de datte existant
     */
    async update(id: string, data: Partial<UpdateTypeDateInput>, tenantId: string) {
        return prisma.typeDate.update({
            where: { id },
            data: {
                ...(data.nom && { nom: data.nom }),
                ...(data.description !== undefined && { description: data.description }),
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Supprime un type de datte
     */
    async delete(id: string, tenantId: string) {
        return prisma.typeDate.delete({
            where: { id },
        });
    },

    /**
     * Vérifie si un type de datte est utilisé (a des livraisons ou du stock)
     */
    async isUsed(id: string, tenantId: string): Promise<boolean> {
        const typeDate = await prisma.typeDate.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        StockDate: true,
                    },
                },
            },
        });

        if (!typeDate) return false;

        return (typeDate._count.LivraisonTypeCaisse > 0 || typeDate._count.StockDate > 0);
    },
};
