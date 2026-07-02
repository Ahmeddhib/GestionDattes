import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

/**
 * Repository MULTI-TENANT pour les agriculteurs
 * Toutes les méthodes filtrent automatiquement par tenantId
 * 
 * RÈGLE CRITIQUE: Le tenantId doit TOUJOURS être passé depuis la session, jamais du client
 */
export const agriculteurRepository = {
    /**
     * Récupérer tous les agriculteurs d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.agriculteur.findMany({
            where: {
                tenantId, // FILTRAGE OBLIGATOIRE
            },
            include: {
                Region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        Livraison: true, // Majuscule (nom de la relation)
                        PretCaisse: true, // Majuscule (nom de la relation)
                    },
                },
            },
            orderBy: {
                nom: "asc",
            },
        });
    },

    /**
     * Récupérer un agriculteur par ID (avec vérification tenant)
     */
    async findById(tenantId: string, id: string) {
        return prisma.agriculteur.findFirst({
            where: {
                id,
                tenantId, // Double vérification: ID + tenant
            },
            include: {
                Region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        Livraison: true, // Majuscule
                        PretCaisse: true, // Majuscule
                    },
                },
            },
        });
    },

    /**
     * Récupérer un agriculteur par code (dans le tenant)
     */
    async findByCode(tenantId: string, code: string) {
        return prisma.agriculteur.findFirst({
            where: {
                code,
                tenantId,
            },
        });
    },

    /**
     * Récupérer un agriculteur par CIN (dans le tenant)
     */
    async findByCin(tenantId: string, cin: string) {
        return prisma.agriculteur.findFirst({
            where: {
                cin,
                tenantId,
            },
        });
    },

    /**
     * Récupérer les agriculteurs par région (dans le tenant)
     */
    async findByRegion(tenantId: string, regionId: string) {
        return prisma.agriculteur.findMany({
            where: {
                regionId,
                tenantId, // Vérifier que la région appartient aussi au tenant
            },
            include: {
                Region: {
                    select: {
                        id: true,
                        nom: true,
                        code: true,
                    },
                },
                _count: {
                    select: {
                        Livraison: true, // Majuscule
                        PretCaisse: true, // Majuscule
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
     * Le tenantId est injecté automatiquement
     */
    async create(
        tenantId: string,
        data: Omit<Prisma.AgriculteurCreateInput, "Tenant">
    ) {
        return prisma.agriculteur.create({
            data: {
                ...data,
                Tenant: {
                    connect: { id: tenantId }, // Injection du tenant
                },
            },
            include: {
                Region: {
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
     * Vérifie que l'agriculteur appartient au tenant
     */
    async update(
        tenantId: string,
        id: string,
        data: Prisma.AgriculteurUpdateInput
    ) {
        // Vérifier d'abord que l'agriculteur appartient au tenant
        const existing = await prisma.agriculteur.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Agriculteur introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.agriculteur.update({
            where: { id },
            data,
            include: {
                Region: {
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
     * Vérifie que l'agriculteur appartient au tenant
     */
    async delete(tenantId: string, id: string) {
        // Vérifier d'abord que l'agriculteur appartient au tenant
        const existing = await prisma.agriculteur.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Agriculteur introuvable ou n'appartient pas à ce tenant");
        }

        return prisma.agriculteur.delete({
            where: { id },
        });
    },

    /**
     * Vérifier si un agriculteur a des livraisons (dans le tenant)
     */
    async hasLivraisons(tenantId: string, id: string): Promise<boolean> {
        const count = await prisma.livraison.count({
            where: {
                agriculteurId: id,
                tenantId, // Vérifier aussi le tenant des livraisons
            },
        });
        return count > 0;
    },

    /**
     * Vérifier si un agriculteur a des prêts de caisses en cours (dans le tenant)
     */
    async hasPretCaissesEnCours(tenantId: string, id: string): Promise<boolean> {
        const count = await prisma.pretCaisse.count({
            where: {
                agriculteurId: id,
                tenantId,
                statut: "EN_COURS",
            },
        });
        return count > 0;
    },

    /**
     * Compter les agriculteurs (dans le tenant)
     */
    async count(tenantId: string): Promise<number> {
        return prisma.agriculteur.count({
            where: { tenantId },
        });
    },
};
