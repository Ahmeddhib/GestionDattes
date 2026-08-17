import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";
import type { CreateDepenseInput, UpdateDepenseInput } from "@/validators/depense-autre.validator";

/**
 * Colonnes triables exposées à l'URL. Table fermée : une clé inconnue retombe
 * sur le tri par défaut, aucun nom de colonne ne transite depuis l'URL.
 */
const TRIS_DEPENSE: Record<
    string,
    (dir: SortDirection) => Prisma.DepenseAutreOrderByWithRelationInput
> = {
    libelle: (dir) => ({ libelle: dir }),
    montant: (dir) => ({ montant: dir }),
    categorie: (dir) => ({ categorie: dir }),
    dateDepense: (dir) => ({ dateDepense: dir }),
};

function buildDepenseWhere(
    tenantId: string,
    search: string,
    saisonId?: string
): Prisma.DepenseAutreWhereInput {
    return {
        tenantId,
        ...(saisonId && { saisonId }),
        ...(search && {
            OR: [
                { libelle: { contains: search, mode: "insensitive" as const } },
                { categorie: { contains: search, mode: "insensitive" as const } },
                { observations: { contains: search, mode: "insensitive" as const } },
            ],
        }),
    };
}

const DEPENSE_INCLUDE = {
    User: { select: { id: true, name: true } },
} satisfies Prisma.DepenseAutreInclude;

export const depenseAutreRepository = {
    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.depenseAutre.findMany({
            where: { tenantId, ...(opts?.saisonId && { saisonId: opts.saisonId }) },
            orderBy: { dateDepense: "desc" },
            include: DEPENSE_INCLUDE,
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
        }
    ) {
        const where = buildDepenseWhere(tenantId, params.search, params.saisonId);
        const orderBy = resolveOrderBy<Prisma.DepenseAutreOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_DEPENSE,
            (dir) => ({ dateDepense: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.depenseAutre.findMany({ where, include: DEPENSE_INCLUDE, orderBy, skip, take }),
            () => prisma.depenseAutre.count({ where })
        );
    },

    /**
     * Toutes les lignes du filtre courant, sans pagination — réservé à l'export.
     * Ne pas l'utiliser pour l'affichage : c'est précisément le chargement
     * complet que la pagination serveur cherche à éviter.
     */
    async findAllFiltre(tenantId: string, params: { search: string; saisonId?: string }) {
        return prisma.depenseAutre.findMany({
            where: buildDepenseWhere(tenantId, params.search, params.saisonId),
            include: DEPENSE_INCLUDE,
            orderBy: { dateDepense: "desc" },
        });
    },

    /**
     * Totaux du jeu FILTRÉ. Sommer les lignes reçues donnerait le total de la
     * page affichée, sans erreur visible.
     */
    async getTotauxFiltres(tenantId: string, params: { search: string; saisonId?: string }) {
        const where = buildDepenseWhere(tenantId, params.search, params.saisonId);
        const agg = await prisma.depenseAutre.aggregate({
            where,
            _count: { _all: true },
            _sum: { montant: true },
        });
        return { total: agg._count._all, montantTotal: agg._sum.montant ?? 0 };
    },

    async findById(tenantId: string, id: string) {
        return prisma.depenseAutre.findFirst({
            where: { id, tenantId },
        });
    },

    async create(tenantId: string, createdById: string, saisonId: string, data: CreateDepenseInput) {
        return prisma.depenseAutre.create({
            data: {
                id: createId(),
                tenantId,
                createdById,
                saisonId,
                libelle: data.libelle,
                montant: data.montant,
                categorie: data.categorie || null,
                dateDepense: data.dateDepense ?? new Date(),
                observations: data.observations || null,
                updatedAt: new Date(),
            },
        });
    },

    async update(tenantId: string, data: UpdateDepenseInput) {
        const existing = await this.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }

        return prisma.depenseAutre.update({
            where: { id: data.id },
            data: {
                libelle: data.libelle,
                montant: data.montant,
                categorie: data.categorie || null,
                dateDepense: data.dateDepense ?? existing.dateDepense,
                observations: data.observations || null,
                updatedAt: new Date(),
            },
        });
    },

    async delete(tenantId: string, id: string) {
        const existing = await this.findById(tenantId, id);
        if (!existing) {
            throw new Error("Dépense introuvable dans cette Wakala");
        }
        return prisma.depenseAutre.delete({ where: { id } });
    },

    /**
     * Total des dépenses sur une période (utilisé par le bilan financier).
     */
    async getTotal(tenantId: string, dateFrom?: Date, dateTo?: Date) {
        const result = await prisma.depenseAutre.aggregate({
            where: {
                tenantId,
                ...(dateFrom || dateTo
                    ? { dateDepense: { ...(dateFrom && { gte: dateFrom }), ...(dateTo && { lte: dateTo }) } }
                    : {}),
            },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },
};
