import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Colonnes triables exposées à l'URL. Table fermée : une clé inconnue retombe
 * sur le tri par défaut, aucun nom de colonne ne transite depuis l'URL.
 */
const TRIS_BON_ACHAT: Record<
    string,
    (dir: SortDirection) => Prisma.BonAchatOrderByWithRelationInput
> = {
    numero: (dir) => ({ numero: dir }),
    montant: (dir) => ({ montant: dir }),
    prixKg: (dir) => ({ prixKg: dir }),
    statut: (dir) => ({ statut: dir }),
    createdAt: (dir) => ({ createdAt: dir }),
    numeroLot: (dir) => ({ Livraison: { numeroLot: dir } }),
};

export interface FiltresBonAchat {
    /** Restreint à un agriculteur. Filtré en base, plus dans le tableau chargé. */
    agriculteurId?: string;
    /** Bornes sur `createdAt`, incluses. */
    from?: Date;
    to?: Date;
}

function buildBonAchatWhere(
    tenantId: string,
    search: string,
    saisonId?: string,
    filtres?: FiltresBonAchat
): Prisma.BonAchatWhereInput {
    return {
        tenantId,
        ...(saisonId && { saisonId }),
        ...(filtres?.agriculteurId && {
            Livraison: { agriculteurId: filtres.agriculteurId },
        }),
        ...((filtres?.from || filtres?.to) && {
            createdAt: {
                ...(filtres.from && { gte: filtres.from }),
                ...(filtres.to && { lte: filtres.to }),
            },
        }),
        ...(search && {
            OR: [
                { numero: { contains: search, mode: "insensitive" as const } },
                { Livraison: { numeroLot: { contains: search, mode: "insensitive" as const } } },
                {
                    Livraison: {
                        Agriculteur: { nom: { contains: search, mode: "insensitive" as const } },
                    },
                },
                {
                    Livraison: {
                        Agriculteur: { code: { contains: search, mode: "insensitive" as const } },
                    },
                },
            ],
        }),
    };
}

const BON_ACHAT_INCLUDE = {
    Livraison: {
        select: {
            id: true,
            numeroLot: true,
            dateLivraison: true,
            Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
            Pesee: {
                select: {
                    id: true,
                    prixKg: true,
                    quantiteAcceptee: true,
                    poidsNetTotal: true,
                    TypeDate: { select: { id: true, nom: true } },
                    TypeCaisse: { select: { id: true, nom: true } },
                },
            },
        },
    },
    User: { select: { id: true, name: true } },
    PaiementAgriculteur: { select: { montant: true } },
} satisfies Prisma.BonAchatInclude;

export const bonAchatRepository = {
    /**
     * Génère un numéro de bon d'achat unique pour le tenant (préfixe BA-<année>-)
     */
    async generateNumeroBonAchat(tenantId: string, client: DbClient = prisma): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `BA-${year}-`;

        const last = await client.bonAchat.findFirst({
            where: { tenantId, numero: { startsWith: prefix } },
            orderBy: { numero: "desc" },
        });

        let nextNumber = 1;
        if (last?.numero) {
            const lastNumber = parseInt(last.numero.split("-").pop() || "0");
            nextNumber = lastNumber + 1;
        }

        return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    },

    async findByLivraisonId(livraisonId: string, tenantId: string, client: DbClient = prisma) {
        return client.bonAchat.findFirst({ where: { livraisonId, tenantId } });
    },

    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.bonAchat.findMany({
            where: { tenantId, ...(opts?.saisonId && { saisonId: opts.saisonId }) },
            include: BON_ACHAT_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    },

    async findPage(
        tenantId: string,
        params: {
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
            filtres?: FiltresBonAchat;
        }
    ) {
        const where = buildBonAchatWhere(tenantId, params.search, params.saisonId, params.filtres);
        const orderBy = resolveOrderBy<Prisma.BonAchatOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_BON_ACHAT,
            (dir) => ({ createdAt: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.bonAchat.findMany({ where, include: BON_ACHAT_INCLUDE, orderBy, skip, take }),
            () => prisma.bonAchat.count({ where })
        );
    },

    /** Toutes les lignes du filtre courant, pour l'export uniquement. */
    async findAllFiltre(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresBonAchat }
    ) {
        return prisma.bonAchat.findMany({
            where: buildBonAchatWhere(tenantId, params.search, params.saisonId, params.filtres),
            include: BON_ACHAT_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Totaux du jeu FILTRÉ. `montantPaye` provient d'une agrégation sur les
     * paiements, et non d'une somme des lignes reçues : la page n'en contient
     * qu'une tranche.
     */
    async getTotauxFiltres(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresBonAchat }
    ) {
        const where = buildBonAchatWhere(tenantId, params.search, params.saisonId, params.filtres);

        const [agg, paye] = await Promise.all([
            prisma.bonAchat.aggregate({ where, _count: { _all: true }, _sum: { montant: true } }),
            prisma.paiementAgriculteur.aggregate({
                where: { tenantId, BonAchat: where },
                _sum: { montant: true },
            }),
        ]);

        const montantTotal = agg._sum.montant ?? 0;
        const montantPaye = paye._sum.montant ?? 0;
        return {
            total: agg._count._all,
            montantTotal,
            montantPaye,
            montantRestant: montantTotal - montantPaye,
        };
    },

    /**
     * Agriculteurs proposés dans le filtre.
     *
     * Requête dédiée et non déduction depuis les lignes affichées : la page
     * n'en contient qu'une tranche, la liste serait donc amputée et changerait
     * à chaque changement de page.
     */
    async findAgriculteursAvecBonAchat(tenantId: string, saisonId?: string) {
        return prisma.agriculteur.findMany({
            where: {
                tenantId,
                Livraison: {
                    some: {
                        BonAchat: { isNot: null },
                        ...(saisonId && { saisonId }),
                    },
                },
            },
            select: { id: true, nom: true, prenom: true, code: true },
            orderBy: [{ nom: "asc" }, { prenom: "asc" }],
        });
    },

    async findById(id: string, tenantId: string) {
        return prisma.bonAchat.findFirst({
            where: { id, tenantId },
            include: {
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                        Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
                    },
                },
                User: { select: { id: true, name: true } },
                PaiementAgriculteur: { select: { montant: true } },
            },
        });
    },

    async create(
        data: {
            numero: string;
            prixKg: number;
            montant: number;
            observations?: string;
            livraisonId: string;
            saisonId: string;
            createdById: string;
            tenantId: string;
        },
        client: DbClient = prisma
    ) {
        return client.bonAchat.create({
            data: {
                id: createId(),
                numero: data.numero,
                prixKg: data.prixKg,
                montant: data.montant,
                observations: data.observations,
                livraisonId: data.livraisonId,
                saisonId: data.saisonId,
                createdById: data.createdById,
                tenantId: data.tenantId,
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Recalcule prixKg/montant/observations d'un bon d'achat existant, appelé
     * automatiquement lors de la resynchronisation d'une livraison modifiée.
     */
    async update(
        id: string,
        data: { prixKg?: number; montant: number; observations?: string },
        client: DbClient = prisma
    ) {
        return client.bonAchat.update({
            where: { id },
            data: {
                ...(data.prixKg !== undefined && { prixKg: data.prixKg }),
                montant: data.montant,
                ...(data.observations !== undefined && { observations: data.observations }),
                updatedAt: new Date(),
            },
        });
    },
};
