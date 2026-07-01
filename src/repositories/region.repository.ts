import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Repository pour les opérations CRUD sur les régions
 * Couche d'accès aux données - pas de logique métier
 */
export const regionRepository = {
    /**
     * Récupérer toutes les régions
     */
    async findAll() {
        return prisma.region.findMany({
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                        users: true,
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Récupérer une région par ID
     */
    async findById(id: string) {
        return prisma.region.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                        users: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer une région par code
     */
    async findByCode(code: string) {
        return prisma.region.findUnique({
            where: { code },
        });
    },

    /**
     * Créer une nouvelle région
     */
    async create(data: Prisma.RegionCreateInput) {
        return prisma.region.create({
            data,
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                        users: true,
                    },
                },
            },
        });
    },

    /**
     * Mettre à jour une région
     */
    async update(id: string, data: Prisma.RegionUpdateInput) {
        return prisma.region.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                        users: true,
                    },
                },
            },
        });
    },

    /**
     * Supprimer une région
     */
    async delete(id: string) {
        return prisma.region.delete({
            where: { id },
        });
    },

    /**
     * Vérifier si une région a des agriculteurs associés
     */
    async hasAgriculteurs(id: string): Promise<boolean> {
        const count = await prisma.agriculteur.count({
            where: { regionId: id },
        });
        return count > 0;
    },

    /**
     * Vérifier si une région a des utilisateurs associés
     */
    async hasUsers(id: string): Promise<boolean> {
        const count = await prisma.user.count({
            where: { regionId: id },
        });
        return count > 0;
    },
};
