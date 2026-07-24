import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { CreatePretCaisseInput } from "@/validators/pret-caisse.validator";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Repository MULTI-TENANT pour les prêts de caisses
 * Toutes les méthodes filtrent automatiquement par tenantId
 */
export const pretCaisseRepository = {
    /**
     * Récupérer le prêt en cours (le plus ancien) d'un agriculteur pour un type de caisse donné
     */
    async findEnCoursByAgriculteurEtType(
        agriculteurId: string,
        typeCaisseId: string,
        tenantId: string,
        client: DbClient = prisma
    ) {
        return client.pretCaisse.findFirst({
            where: {
                agriculteurId,
                typeCaisseId,
                tenantId,
                statut: "EN_COURS",
            },
            orderBy: { datePreT: "asc" },
        });
    },
    /**
     * Récupérer tous les prêts de caisses d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.pretCaisse.findMany({
            where: {
                tenantId,
            },
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
                TypeCaisse: {
                    select: {
                        id: true,
                        nom: true,
                        poidsKg: true,
                        stockDisponible: true,
                    },
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    /**
     * Récupérer un prêt par ID (avec vérification tenant)
     */
    async findById(id: string, tenantId: string) {
        return prisma.pretCaisse.findFirst({
            where: {
                id,
                tenantId,
            },
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
                TypeCaisse: {
                    select: {
                        id: true,
                        nom: true,
                        poidsKg: true,
                        stockDisponible: true,
                    },
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer les prêts d'un agriculteur
     */
    async findByAgriculteur(agriculteurId: string, tenantId: string) {
        return prisma.pretCaisse.findMany({
            where: {
                agriculteurId,
                tenantId,
            },
            include: {
                TypeCaisse: {
                    select: {
                        id: true,
                        nom: true,
                        poidsKg: true,
                    },
                },
                User: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    /**
     * Récupérer les prêts en cours d'un agriculteur
     */
    async findPretsEnCours(agriculteurId: string, tenantId: string) {
        return prisma.pretCaisse.findMany({
            where: {
                agriculteurId,
                tenantId,
                statut: "EN_COURS",
            },
            include: {
                TypeCaisse: {
                    select: {
                        id: true,
                        nom: true,
                        poidsKg: true,
                    },
                },
            },
            orderBy: {
                datePreT: "desc",
            },
        });
    },

    /**
     * Créer un nouveau prêt de caisses
     */
    async create(
        data: CreatePretCaisseInput,
        tenantId: string,
        createdById: string
    ) {
        const { createId } = await import("@paralleldrive/cuid2");

        return prisma.pretCaisse.create({
            data: {
                id: createId(),
                nombrePrete: data.nombrePrete,
                nombreRetourne: 0,
                statut: "EN_COURS",
                datePreT: new Date(),
                observations: data.observations,
                updatedAt: new Date(),
                Agriculteur: {
                    connect: { id: data.agriculteurId },
                },
                TypeCaisse: {
                    connect: { id: data.typeCaisseId },
                },
                User: {
                    connect: { id: createdById },
                },
                Tenant: {
                    connect: { id: tenantId },
                },
                ...(data.livraisonId && {
                    Livraison: {
                        connect: { id: data.livraisonId },
                    },
                }),
            },
            include: {
                Agriculteur: true,
                TypeCaisse: true,
                User: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    },

    /**
     * Mettre à jour le retour de caisses
     */
    async retournerCaisses(
        pretId: string,
        nombreRetourne: number,
        tenantId: string,
        observations?: string,
        client: DbClient = prisma
    ) {
        // Récupérer le prêt actuel
        const pret = await client.pretCaisse.findFirst({
            where: { id: pretId, tenantId },
        });

        if (!pret) {
            throw new Error("Prêt introuvable");
        }

        // Calculer le nouveau total retourné
        const nouveauNombreRetourne = pret.nombreRetourne + nombreRetourne;

        // Vérifier qu'on ne retourne pas plus que prêté
        if (nouveauNombreRetourne > pret.nombrePrete) {
            throw new Error(
                `Impossible de retourner ${nombreRetourne} caisses. Restant: ${pret.nombrePrete - pret.nombreRetourne}`
            );
        }

        // Déterminer le nouveau statut
        const estComplet = nouveauNombreRetourne === pret.nombrePrete;
        const nouveauStatut = estComplet ? "RETOURNE" : "EN_COURS";

        // Mettre à jour le prêt
        return client.pretCaisse.update({
            where: { id: pretId },
            data: {
                nombreRetourne: nouveauNombreRetourne,
                statut: nouveauStatut,
                dateRetour: estComplet ? new Date() : null,
                observations: observations
                    ? `${pret.observations || ""}\n${observations}`.trim()
                    : pret.observations,
                updatedAt: new Date(),
            },
            include: {
                Agriculteur: true,
                TypeCaisse: true,
            },
        });
    },

    /**
     * Calculer le nombre de caisses restant à retourner pour un agriculteur
     */
    async getNombreCaissesRestantes(agriculteurId: string, tenantId: string) {
        const prets = await prisma.pretCaisse.findMany({
            where: {
                agriculteurId,
                tenantId,
                statut: "EN_COURS",
            },
            select: {
                nombrePrete: true,
                nombreRetourne: true,
                TypeCaisse: {
                    select: {
                        nom: true,
                    },
                },
            },
        });

        return prets.map((pret) => ({
            typeCaisse: pret.TypeCaisse.nom,
            restant: pret.nombrePrete - pret.nombreRetourne,
        }));
    },

    /**
     * Obtenir les statistiques des prêts
     */
    async getStatistiques(tenantId: string) {
        const [totalPrete, totalRetourne, pretsEnCours] = await Promise.all([
            // Total prêté (tous statuts)
            prisma.pretCaisse.aggregate({
                where: { tenantId },
                _sum: {
                    nombrePrete: true,
                },
            }),
            // Total retourné (tous statuts)
            prisma.pretCaisse.aggregate({
                where: { tenantId },
                _sum: {
                    nombreRetourne: true,
                },
            }),
            // Nombre de prêts en cours
            prisma.pretCaisse.count({
                where: {
                    tenantId,
                    statut: "EN_COURS",
                },
            }),
        ]);

        return {
            totalPrete: totalPrete._sum.nombrePrete || 0,
            totalRetourne: totalRetourne._sum.nombreRetourne || 0,
            restant: (totalPrete._sum.nombrePrete || 0) - (totalRetourne._sum.nombreRetourne || 0),
            pretsEnCours,
        };
    },

    /**
     * Compter les prêts
     */
    async count(tenantId: string): Promise<number> {
        return prisma.pretCaisse.count({
            where: { tenantId },
        });
    },
};
