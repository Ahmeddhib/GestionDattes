import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

/**
 * Colonnes de lot triables, exposées à l'interface. Table fermée : une clé
 * inconnue retombe sur le tri par défaut, aucun nom de colonne ne transite
 * depuis le client.
 */
const TRIS_LOT: Record<string, (dir: SortDirection) => Prisma.StockDateOrderByWithRelationInput> = {
    numeroLot: (dir) => ({ Livraison: { numeroLot: dir } }),
    dateEntree: (dir) => ({ dateEntree: dir }),
    quantite: (dir) => ({ quantite: dir }),
    quantiteDisponible: (dir) => ({ quantiteDisponible: dir }),
};

/**
 * `saisonId` filtre sur `saisonOrigineId` — la saison d'ENTRÉE du lot. Voir le
 * commentaire du champ dans `schema.prisma` : un lot entré en saison A reste
 * attribué à A même vendu pendant la saison B.
 */
function buildLotWhere(
    tenantId: string,
    params: { typeDateId?: string; search?: string; saisonId?: string }
): Prisma.StockDateWhereInput {
    const { typeDateId, search, saisonId } = params;

    return {
        tenantId,
        ...(typeDateId && { typeDateId }),
        ...(saisonId && { saisonOrigineId: saisonId }),
        ...(search && {
            OR: [
                { Livraison: { numeroLot: { contains: search, mode: "insensitive" as const } } },
                { Livraison: { Agriculteur: { nom: { contains: search, mode: "insensitive" as const } } } },
                { Livraison: { Agriculteur: { prenom: { contains: search, mode: "insensitive" as const } } } },
                { Livraison: { Agriculteur: { code: { contains: search, mode: "insensitive" as const } } } },
            ],
        }),
    };
}

const LOT_INCLUDE = {
    Livraison: {
        select: {
            id: true,
            numeroLot: true,
            Agriculteur: { select: { id: true, nom: true, prenom: true, code: true } },
        },
    },
} satisfies Prisma.StockDateInclude;

export const stockDateRepository = {
    /**
     * Une ligne par type de datte, agrégée PAR LA BASE.
     *
     * L'implémentation précédente chargeait chaque `StockDate` du tenant pour
     * les regrouper en mémoire — 30 lignes lues pour en afficher 4 aujourd'hui,
     * et autant de lignes que de livraisons demain. Le `groupBy` rend le coût
     * indépendant du nombre de lots.
     *
     * Le jeu retourné n'est pas paginé, et c'est volontaire : sa cardinalité est
     * bornée par la table de référence `TypeDate` (contrainte `@@unique([tenantId,
     * nom])`), pas par le volume d'activité. Paginer quatre lignes n'apporterait
     * rien ; ce qui coûtait cher, c'était de lire les lots pour les obtenir.
     */
    async findGroupesParType(tenantId: string, opts?: { saisonId?: string }) {
        const where = buildLotWhere(tenantId, { saisonId: opts?.saisonId });

        const groupes = await prisma.stockDate.groupBy({
            by: ["typeDateId"],
            where,
            _sum: { quantite: true, quantiteDisponible: true },
            _count: true,
        });

        if (groupes.length === 0) return [];

        const types = await prisma.typeDate.findMany({
            where: { tenantId, id: { in: groupes.map((g) => g.typeDateId) } },
            select: { id: true, nom: true },
        });
        const nomParId = new Map(types.map((type) => [type.id, type.nom]));

        return groupes
            .map((g) => ({
                typeDateId: g.typeDateId,
                typeDate: nomParId.get(g.typeDateId) ?? "—",
                quantiteTotale: g._sum.quantite ?? 0,
                quantiteDisponible: g._sum.quantiteDisponible ?? 0,
                nombreLots: g._count,
            }))
            .sort((a, b) => a.typeDate.localeCompare(b.typeDate));
    },

    /**
     * Une page de lots pour un type de datte donné.
     *
     * Les lots ne sont plus embarqués dans la ligne du tableau : ils sont lus
     * quand la boîte de dialogue s'ouvre. Les embarquer sérialisait la totalité
     * du stock dans la charge utile de la page, pour un détail que l'utilisateur
     * n'ouvre presque jamais.
     */
    async findLotsPage(
        tenantId: string,
        params: {
            typeDateId: string;
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
        }
    ) {
        const where = buildLotWhere(tenantId, {
            typeDateId: params.typeDateId,
            search: params.search,
            saisonId: params.saisonId,
        });
        const orderBy = resolveOrderBy<Prisma.StockDateOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_LOT,
            (dir) => ({ dateEntree: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.stockDate.findMany({ where, include: LOT_INCLUDE, orderBy, skip, take }),
            () => prisma.stockDate.count({ where })
        );
    },

    /**
     * Lots de stock disponibles à la vente (quantiteDisponible > 0),
     * niveau lot (une ligne par livraison/type de datte), pas agrégé par type.
     */
    async findAvailableLots(tenantId: string) {
        return prisma.stockDate.findMany({
            where: { tenantId, quantiteDisponible: { gt: 0 } },
            include: {
                TypeDate: { select: { id: true, nom: true } },
                Livraison: { select: { id: true, numeroLot: true } },
            },
            orderBy: { dateEntree: "asc" },
        });
    },

    async findById(tenantId: string, id: string) {
        return prisma.stockDate.findFirst({
            where: { id, tenantId },
        });
    },
};
