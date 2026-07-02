import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Repository MULTI-TENANT pour les régions
 * Toutes les méthodes filtrent automatiquement par tenantId
 * 
 * RÈGLE CRITIQUE: Le tenantId doit TOUJOURS être passé depuis la session, jamais du client
 */
export const regionRepository = {
    /**
     * Récupérer toutes les régions d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.region.findMany({
            where: {
                tenantId, // FILTRAGE OBLIGATOIRE
            },
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Récupérer une région par ID (avec vérification tenant)
     */
    async findById(tenantId: string, id: string) {
        return prisma.region.findFirst({
            where: {
                id,
                tenantId, // Double vérification: ID + tenant
            },
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer une région par code (dans le tenant)
     */
    async findByCode(tenantId: string, code: string) {
        return prisma.region.findFirst({
            where: {
                code,
                tenantId,
            },
        });
    },

    /**
     * Créer une nouvelle région
     * Le tenantId est injecté automatiquement
     */
    async create(
        tenantId: string,
        data: Omit<Prisma.RegionCreateInput, "tenant">
    ) {
        return prisma.region.create({
            data: {
                ...data,
                tenant: {
                    connect: { id: tenantId }, // Injection du tenant
                },
            },
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                    },
                },
            },
        });
    },

    /**
     * Mettre à jour une région
     * Vérifie que la région appartient au tenant
     */
    async update(
        tenantId: string,
        id: string,
        data: Prisma.RegionUpdateInput
    ) {
        // Vérifier d'abord que la région appartient au tenant
        const existing = await prisma.region.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Région introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.region.update({
            where: { id },
            data,
            include: {
                _count: {
                    select: {
                        agriculteurs: true,
                    },
                },
            },
        });
    },

    /**
     * Supprimer une région
     * Vérifie que la région appartient au tenant
     */
    async delete(tenantId: string, id: string) {
        // Vérifier d'abord que la région appartient au tenant
        const existing = await prisma.region.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Région introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.region.delete({
            where: { id },
        });
    },

    /**
     * Vérifier si une région a des agriculteurs associés (dans le tenant)
     */
    async hasAgriculteurs(tenantId: string, id: string): Promise<boolean> {
        const count = await prisma.agriculteur.count({
            where: {
                regionId: id,
                tenantId, // Vérifier aussi le tenant des agriculteurs
            },
        });
        return count > 0;
    },

    /**
     * Compter les régions (dans le tenant)
     */
    async count(tenantId: string): Promise<number> {
        return prisma.region.count({
            where: { tenantId },
        });
    },
};
