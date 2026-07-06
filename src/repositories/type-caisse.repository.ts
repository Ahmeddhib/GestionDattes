import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Repository MULTI-TENANT pour les types de caisses
 * Toutes les méthodes filtrent automatiquement par tenantId
 * 
 * RÈGLE CRITIQUE: Le tenantId doit TOUJOURS être passé depuis la session, jamais du client
 */
export const typeCaisseRepository = {
    /**
     * Récupérer tous les types de caisses d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.typeCaisse.findMany({
            where: {
                tenantId, // FILTRAGE OBLIGATOIRE
            },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        PretCaisse: true,
                        BonSortie: true,
                        Conditionnement: true,
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Récupérer un type de caisse par ID (avec vérification tenant)
     */
    async findById(tenantId: string, id: string) {
        return prisma.typeCaisse.findFirst({
            where: {
                id,
                tenantId, // Double vérification: ID + tenant
            },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        PretCaisse: true,
                        BonSortie: true,
                        Conditionnement: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer un type de caisse par nom (dans le tenant)
     */
    async findByNom(tenantId: string, nom: string) {
        return prisma.typeCaisse.findFirst({
            where: {
                nom,
                tenantId,
            },
        });
    },

    /**
     * Créer un nouveau type de caisse
     * Le tenantId est injecté automatiquement
     */
    async create(
        tenantId: string,
        data: { nom: string; poidsKg: number; stockDisponible?: number }
    ) {
        const { createId } = await import("@paralleldrive/cuid2");
        return prisma.typeCaisse.create({
            data: {
                id: createId(),
                nom: data.nom,
                poidsKg: data.poidsKg,
                stockDisponible: data.stockDisponible ?? 0,
                updatedAt: new Date(),
                Tenant: {
                    connect: { id: tenantId }, // Injection du tenant
                },
            },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        PretCaisse: true,
                        BonSortie: true,
                        Conditionnement: true,
                    },
                },
            },
        });
    },

    /**
     * Mettre à jour un type de caisse
     * Vérifie que le type de caisse appartient au tenant
     */
    async update(
        tenantId: string,
        id: string,
        data: Prisma.TypeCaisseUpdateInput
    ) {
        // Vérifier d'abord que le type de caisse appartient au tenant
        const existing = await prisma.typeCaisse.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Type de caisse introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.typeCaisse.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        PretCaisse: true,
                        BonSortie: true,
                        Conditionnement: true,
                    },
                },
            },
        });
    },

    /**
     * Supprimer un type de caisse
     * Vérifie que le type de caisse appartient au tenant
     */
    async delete(tenantId: string, id: string) {
        // Vérifier d'abord que le type de caisse appartient au tenant
        const existing = await prisma.typeCaisse.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Type de caisse introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.typeCaisse.delete({
            where: { id },
        });
    },

    /**
     * Vérifier si un type de caisse est utilisé
     */
    async isUsed(tenantId: string, id: string): Promise<boolean> {
        const typeCaisse = await prisma.typeCaisse.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        LivraisonTypeCaisse: true,
                        PretCaisse: true,
                        BonSortie: true,
                        Conditionnement: true,
                    },
                },
            },
        });

        if (!typeCaisse) return false;

        const totalUsage =
            (typeCaisse._count?.LivraisonTypeCaisse || 0) +
            (typeCaisse._count?.PretCaisse || 0) +
            (typeCaisse._count?.BonSortie || 0) +
            (typeCaisse._count?.Conditionnement || 0);

        return totalUsage > 0;
    },

    /**
     * Compter les types de caisses (dans le tenant)
     */
    async count(tenantId: string): Promise<number> {
        return prisma.typeCaisse.count({
            where: { tenantId },
        });
    },
};
