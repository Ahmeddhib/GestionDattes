import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type { CreatePretCaisseInput } from "@/validators/pret-caisse.validator";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

type DbClient = typeof prisma | Prisma.TransactionClient;

export type StatutPretFiltre = "EN_COURS" | "RETOURNE" | "INCOMPLET";

export interface FiltresPret {
    agriculteurId?: string;
    typeCaisseId?: string;
    statut?: StatutPretFiltre;
    /** Bornes sur `datePreT`, incluses. */
    from?: Date;
    to?: Date;
}

/**
 * Colonnes triables, par identifiant de colonne du tableau.
 *
 * `nombreRestant` en est absent : c'est `nombrePrete − nombreRetourne`, calculé
 * après lecture. Aucun `ORDER BY` ne l'exprime, et le proposer trierait sur
 * autre chose que ce que la colonne affiche.
 */
const TRIS_PRET: Record<string, (dir: SortDirection) => Prisma.PretCaisseOrderByWithRelationInput> = {
    agriculteur: (dir) => ({ Agriculteur: { nom: dir } }),
    typeCaisse: (dir) => ({ TypeCaisse: { nom: dir } }),
    nombrePrete: (dir) => ({ nombrePrete: dir }),
    nombreRetourne: (dir) => ({ nombreRetourne: dir }),
    statut: (dir) => ({ statut: dir }),
    datePreT: (dir) => ({ datePreT: dir }),
};

function buildPretWhere(
    tenantId: string,
    search: string,
    saisonId?: string,
    filtres?: FiltresPret
): Prisma.PretCaisseWhereInput {
    return {
        tenantId,
        ...(saisonId && { saisonId }),
        ...(filtres?.agriculteurId && { agriculteurId: filtres.agriculteurId }),
        ...(filtres?.typeCaisseId && { typeCaisseId: filtres.typeCaisseId }),
        ...(filtres?.statut && { statut: filtres.statut }),
        ...((filtres?.from || filtres?.to) && {
            datePreT: {
                ...(filtres.from && { gte: filtres.from }),
                ...(filtres.to && { lte: filtres.to }),
            },
        }),
        ...(search && {
            OR: [
                { Agriculteur: { nom: { contains: search, mode: "insensitive" as const } } },
                { Agriculteur: { prenom: { contains: search, mode: "insensitive" as const } } },
                { Agriculteur: { code: { contains: search, mode: "insensitive" as const } } },
            ],
        }),
    };
}

const PRET_INCLUDE = {
    Agriculteur: { select: { id: true, code: true, nom: true, prenom: true, cin: true } },
    TypeCaisse: { select: { id: true, nom: true, poidsKg: true, stockDisponible: true } },
    User: { select: { id: true, name: true, email: true } },
    Livraison: { select: { id: true, numeroLot: true, dateLivraison: true } },
    Livreur: { select: { id: true, nom: true, telephone: true } },
} satisfies Prisma.PretCaisseInclude;

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
    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.pretCaisse.findMany({
            where: {
                tenantId,
                ...(opts?.saisonId && { saisonId: opts.saisonId }),
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
                Livreur: {
                    select: {
                        id: true,
                        nom: true,
                        telephone: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    /** Une page de prêts, filtrée et triée par la base. */
    async findPage(
        tenantId: string,
        params: {
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
            filtres?: FiltresPret;
        }
    ) {
        const where = buildPretWhere(tenantId, params.search, params.saisonId, params.filtres);
        const orderBy = resolveOrderBy<Prisma.PretCaisseOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_PRET,
            (dir) => ({ createdAt: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.pretCaisse.findMany({ where, include: PRET_INCLUDE, orderBy, skip, take }),
            () => prisma.pretCaisse.count({ where })
        );
    },

    /** Toutes les lignes du filtre courant, sans pagination — réservé à l'export. */
    async findAllFiltre(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresPret }
    ) {
        return prisma.pretCaisse.findMany({
            where: buildPretWhere(tenantId, params.search, params.saisonId, params.filtres),
            include: PRET_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Totaux du jeu FILTRÉ. Distincts des statistiques globales de l'en-tête,
     * qui restent volontairement un instantané physique toutes saisons.
     */
    async getTotauxFiltres(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresPret }
    ) {
        const where = buildPretWhere(tenantId, params.search, params.saisonId, params.filtres);
        const agg = await prisma.pretCaisse.aggregate({
            where,
            _count: { _all: true },
            _sum: { nombrePrete: true, nombreRetourne: true },
        });

        const prete = agg._sum.nombrePrete ?? 0;
        const retourne = agg._sum.nombreRetourne ?? 0;
        return { total: agg._count._all, totalPrete: prete, totalRetourne: retourne, restant: prete - retourne };
    },

    /**
     * Agriculteurs et types de caisse proposés dans les filtres.
     *
     * Requêtes dédiées et non déduction depuis les lignes affichées : une page
     * n'en contient qu'une tranche, les menus seraient amputés et changeraient à
     * chaque changement de page.
     */
    async findOptionsFiltres(tenantId: string, saisonId?: string) {
        const [agriculteurs, typesCaisses] = await Promise.all([
            prisma.agriculteur.findMany({
                where: { tenantId, PretCaisse: { some: { tenantId, ...(saisonId && { saisonId }) } } },
                select: { id: true, nom: true, prenom: true, code: true },
                orderBy: [{ nom: "asc" }, { prenom: "asc" }],
            }),
            prisma.typeCaisse.findMany({
                where: { tenantId, PretCaisse: { some: { tenantId, ...(saisonId && { saisonId }) } } },
                select: { id: true, nom: true },
                orderBy: { nom: "asc" },
            }),
        ]);

        return { agriculteurs, typesCaisses };
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
                Livreur: {
                    select: {
                        id: true,
                        nom: true,
                        telephone: true,
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
        createdById: string,
        saisonId: string,
        // Sans ce paramètre, la création partait toujours sur le client global :
        // appelée depuis une transaction, elle s'exécutait EN DEHORS, et le prêt
        // subsistait si le décrément de stock échouait ensuite.
        client: DbClient = prisma
    ) {
        const { createId } = await import("@paralleldrive/cuid2");

        return client.pretCaisse.create({
            data: {
                id: createId(),
                nombrePrete: data.nombrePrete,
                nombreRetourne: 0,
                statut: "EN_COURS",
                datePreT: new Date(),
                observations: data.observations,
                updatedAt: new Date(),
                Saison: {
                    connect: { id: saisonId },
                },
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
                ...(data.livreurId && {
                    Livreur: {
                        connect: { id: data.livreurId },
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
                Livreur: {
                    select: {
                        id: true,
                        nom: true,
                        telephone: true,
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
