import { prisma } from "@/lib/prisma";
import type { CreateLivraisonInput, UpdateLivraisonInput } from "@/validators/livraison.validator";

/**
 * Repository pour la gestion des livraisons (multi-tenant)
 */
export const livraisonRepository = {
    /**
     * Récupère toutes les livraisons d'un tenant avec relations
     */
    async findAll(tenantId: string) {
        return prisma.livraison.findMany({
            where: { tenantId },
            include: {
                Agriculteur: {
                    select: {
                        id: true,
                        code: true,
                        nom: true,
                        prenom: true,
                        cin: true,
                    },
                },
                TypeDate: {
                    select: {
                        id: true,
                        nom: true,
                    },
                },
                LivraisonTypeCaisse: {
                    include: {
                        TypeCaisse: {
                            select: {
                                id: true,
                                nom: true,
                                poidsKg: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        Echantillon: true,
                        PretCaisse: true,
                        StockDate: true,
                    },
                },
            },
            orderBy: { dateLivraison: "desc" },
        });
    },

    /**
     * Récupère une livraison par son ID avec toutes les relations
     */
    async findById(id: string, tenantId: string) {
        return prisma.livraison.findFirst({
            where: { id, tenantId },
            include: {
                Agriculteur: {
                    select: {
                        id: true,
                        code: true,
                        nom: true,
                        prenom: true,
                        cin: true,
                        telephone: true,
                        Region: {
                            select: {
                                id: true,
                                nom: true,
                            },
                        },
                    },
                },
                TypeDate: true,
                LivraisonTypeCaisse: {
                    include: {
                        TypeCaisse: true,
                    },
                },
                Pesee: true,
                Echantillon: {
                    include: {
                        Analyse: true,
                    },
                },
                PretCaisse: true,
                StockDate: true,
            },
        });
    },

    /**
     * Récupère une livraison par son numéro de lot
     */
    async findByNumeroLot(numeroLot: string, tenantId: string) {
        return prisma.livraison.findFirst({
            where: { numeroLot, tenantId },
        });
    },

    /**
     * Génère un numéro de lot unique pour le tenant
     */
    async generateNumeroLot(tenantId: string): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `LIV-${year}-`;

        // Récupérer le dernier numéro de lot de l'année
        const lastLivraison = await prisma.livraison.findFirst({
            where: {
                tenantId,
                numeroLot: {
                    startsWith: prefix,
                },
            },
            orderBy: { numeroLot: "desc" },
        });

        let nextNumber = 1;
        if (lastLivraison?.numeroLot) {
            const lastNumber = parseInt(lastLivraison.numeroLot.split("-").pop() || "0");
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },

    /**
     * Crée une nouvelle livraison avec plusieurs types de caisses
     */
    async create(data: CreateLivraisonInput, tenantId: string, numeroLot: string) {
        return prisma.livraison.create({
            data: {
                id: `livraison_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                numeroLot,
                dateLivraison: new Date(data.dateLivraison),
                agriculteurId: data.agriculteurId,
                typeDateId: data.typeDateId,
                tenantId,
                createdAt: new Date(),
                updatedAt: new Date(),
                LivraisonTypeCaisse: {
                    create: data.caisses.map((caisse) => ({
                        id: `ltc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        typeCaisseId: caisse.typeCaisseId,
                        quantite: caisse.quantite,
                        createdAt: new Date(),
                    })),
                },
            },
            include: {
                Agriculteur: {
                    select: {
                        nom: true,
                        prenom: true,
                    },
                },
                TypeDate: {
                    select: {
                        nom: true,
                    },
                },
                LivraisonTypeCaisse: {
                    include: {
                        TypeCaisse: true,
                    },
                },
            },
        });
    },

    /**
     * Met à jour une livraison existante avec plusieurs types de caisses
     */
    async update(id: string, data: Partial<UpdateLivraisonInput>, tenantId: string) {
        // Si les caisses sont mises à jour, on supprime les anciennes et on crée les nouvelles
        const updateData: any = {
            ...(data.dateLivraison && { dateLivraison: new Date(data.dateLivraison) }),
            ...(data.agriculteurId && { agriculteurId: data.agriculteurId }),
            ...(data.typeDateId && { typeDateId: data.typeDateId }),
            updatedAt: new Date(),
        };

        if (data.caisses) {
            updateData.LivraisonTypeCaisse = {
                deleteMany: {}, // Supprimer toutes les anciennes caisses
                create: data.caisses.map((caisse) => ({
                    id: `ltc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    typeCaisseId: caisse.typeCaisseId,
                    quantite: caisse.quantite,
                    createdAt: new Date(),
                })),
            };
        }

        return prisma.livraison.update({
            where: { id },
            data: updateData,
            include: {
                LivraisonTypeCaisse: {
                    include: {
                        TypeCaisse: true,
                    },
                },
            },
        });
    },

    /**
     * Supprime une livraison
     */
    async delete(id: string, tenantId: string) {
        return prisma.livraison.delete({
            where: { id },
        });
    },

    /**
     * Vérifie si une livraison est utilisée (a des relations)
     */
    async isUsed(id: string, tenantId: string): Promise<boolean> {
        const livraison = await prisma.livraison.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        Echantillon: true,
                        PretCaisse: true,
                        StockDate: true,
                    },
                },
                Pesee: true,
            },
        });

        if (!livraison) return false;

        return (
            !!livraison.Pesee ||
            livraison._count.Echantillon > 0 ||
            livraison._count.PretCaisse > 0 ||
            livraison._count.StockDate > 0
        );
    },

    /**
     * Récupère les statistiques des livraisons
     */
    async getStatistics(tenantId: string) {
        const [total, thisMonth, thisYear] = await Promise.all([
            // Total des livraisons
            prisma.livraison.count({ where: { tenantId } }),

            // Livraisons ce mois
            prisma.livraison.count({
                where: {
                    tenantId,
                    dateLivraison: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),

            // Livraisons cette année
            prisma.livraison.count({
                where: {
                    tenantId,
                    dateLivraison: {
                        gte: new Date(new Date().getFullYear(), 0, 1),
                    },
                },
            }),
        ]);

        // Calculer la quantité totale en kg depuis LivraisonTypeCaisse
        const totalQuantityResult = await prisma.$queryRaw<Array<{ total: bigint }>>`
            SELECT COALESCE(SUM(ltc.quantite * tc."poidsKg"), 0) as total
            FROM "LivraisonTypeCaisse" ltc
            INNER JOIN "TypeCaisse" tc ON ltc."typeCaisseId" = tc.id
            INNER JOIN "Livraison" l ON ltc."livraisonId" = l.id
            WHERE l."tenantId" = ${tenantId}
        `;

        return {
            total,
            thisMonth,
            thisYear,
            totalQuantityKg: Number(totalQuantityResult[0]?.total || 0),
        };
    },

    /**
     * Récupère les livraisons par agriculteur
     */
    async findByAgriculteur(agriculteurId: string, tenantId: string) {
        return prisma.livraison.findMany({
            where: {
                agriculteurId,
                tenantId,
            },
            include: {
                TypeDate: true,
                LivraisonTypeCaisse: {
                    include: {
                        TypeCaisse: true,
                    },
                },
            },
            orderBy: { dateLivraison: "desc" },
        });
    },

    /**
     * Calcule la quantité totale en kg pour une livraison
     */
    async calculateTotalQuantityKg(livraisonId: string): Promise<number> {
        const result = await prisma.$queryRaw<Array<{ total: number }>>`
            SELECT COALESCE(SUM(ltc.quantite * tc."poidsKg"), 0) as total
            FROM "LivraisonTypeCaisse" ltc
            INNER JOIN "TypeCaisse" tc ON ltc."typeCaisseId" = tc.id
            WHERE ltc."livraisonId" = ${livraisonId}
        `;
        return Number(result[0]?.total || 0);
    },
};
