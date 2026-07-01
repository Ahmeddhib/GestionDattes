import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Repository pour les opérations CRUD sur les agriculteurs
 * Couche d'accès aux données - pas de logique métier
 */
export const agriculteurRepository = {
    /**
     * Récupérer tous les agriculteurs
     */
    async findAll() {
        return prisma.agriculteur.findMany({
            include: {
                region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        livraisons: true,
                        pretCaisses: true,
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Récupérer un agriculteur par ID
     */
    async findById(id: string) {
        return prisma.agriculteur.findUnique({
            where: { id },
            include: {
                region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        livraisons: true,
                        pretCaisses: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer un agriculteur par code
     */
    async findByCode(code: string) {
        return prisma.agriculteur.findUnique({
            where: { code },
        });
    },

    /**
     * Récupérer un agriculteur par CIN
     */
    async findByCin(cin: string) {
        return prisma.agriculteur.findUnique({
            where: { cin },
        });
    },

    /**
     * Récupérer les agriculteurs par région
     */
    async findByRegion(regionId: string) {
        return prisma.agriculteur.findMany({
            where: { regionId },
            include: {
                region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        livraisons: true,
                        pretCaisses: true,
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Créer un nouvel agriculteur
     */
    async create(data: Prisma.AgriculteurCreateInput) {
        return prisma.agriculteur.create({
            data,
            include: {
                region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
            },
        });
    },

    /**
     * Mettre à jour un agriculteur
     */
    async update(id: string, data: Prisma.AgriculteurUpdateInput) {
        return prisma.agriculteur.update({
            where: { id },
            data,
            include: {
                region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
            },
        });
    },

    /**
     * Supprimer un agriculteur
     */
    async delete(id: string) {
        return prisma.agriculteur.delete({
            where: { id },
        });
    },

    /**
     * Vérifier si un agriculteur a des livraisons
     */
    async hasLivraisons(id: string): Promise<boolean> {
        const count = await prisma.livraison.count({
            where: { agriculteurId: id },
        });
        return count > 0;
    },

    /**
     * Vérifier si un agriculteur a des prêts de caisses en cours
     */
    async hasPretCaissesEnCours(id: string): Promise<boolean> {
        const count = await prisma.pretCaisse.count({
            where: {
                agriculteurId: id,
                statut: "EN_COURS",
            },
        });
        return count > 0;
    },
};
