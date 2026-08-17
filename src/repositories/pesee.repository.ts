import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Tris exposés à l'URL. Volontairement limités aux colonnes de la LIVRAISON :
 * les autres colonnes du tableau (poids, nombre de caisses, montant) sont des
 * sommes de ses pesées, qu'aucun `ORDER BY` ne sait produire ici. Les rendre
 * cliquables donnerait un tri faux sans le dire.
 */
const TRIS_LIVRAISON_PESEE: Record<
    string,
    (dir: SortDirection) => Prisma.LivraisonOrderByWithRelationInput
> = {
    numeroLot: (dir) => ({ numeroLot: dir }),
    agriculteur: (dir) => ({ Agriculteur: { nom: dir } }),
};

/**
 * Le tableau des pesées affiche UNE LIGNE PAR LIVRAISON, chacune agrégeant ses
 * `Pesee` (une par couple type de datte / type de caisse). La pagination porte
 * donc sur la livraison, pas sur la pesée — sinon une page de dix pesées
 * produirait un nombre de lignes imprévisible, et une livraison serait coupée
 * en deux entre deux pages.
 */
function buildLivraisonPeseeWhere(
    tenantId: string,
    search: string,
    saisonId?: string
): Prisma.LivraisonWhereInput {
    return {
        tenantId,
        // Seules les livraisons effectivement pesées : le tableau se construisait
        // à partir des `Pesee`, une livraison sans pesée n'y figurait pas.
        Pesee: { some: {} },
        ...(saisonId && { saisonId }),
        ...(search && {
            OR: [
                { numeroLot: { contains: search, mode: "insensitive" as const } },
                { Agriculteur: { nom: { contains: search, mode: "insensitive" as const } } },
                { Agriculteur: { prenom: { contains: search, mode: "insensitive" as const } } },
                { Agriculteur: { code: { contains: search, mode: "insensitive" as const } } },
            ],
        }),
    };
}

const LIVRAISON_PESEE_SELECT = {
    id: true,
    numeroLot: true,
    dateLivraison: true,
    createdAt: true,
    Agriculteur: { select: { id: true, code: true, nom: true, prenom: true } },
    Pesee: {
        // `Caisses` volontairement absent : le détail des lignes n'affiche que le
        // type et les totaux. Les charger ramenait une ligne par caisse pesée —
        // des centaines de lignes jamais lues.
        select: {
            id: true,
            livraisonId: true,
            typeCaisseId: true,
            typeDateId: true,
            nombreCaisses: true,
            poidsBrutTotal: true,
            poidsTareTotal: true,
            poidsNetTotal: true,
            prixKg: true,
            quantiteAcceptee: true,
            createdAt: true,
            TypeCaisse: { select: { id: true, nom: true } },
            TypeDate: { select: { id: true, nom: true } },
        },
        orderBy: { createdAt: "asc" as const },
    },
} satisfies Prisma.LivraisonSelect;

export type LivraisonPeseeRow = Prisma.LivraisonGetPayload<{
    select: typeof LIVRAISON_PESEE_SELECT;
}>;

export interface PeseeTotals {
    nombreCaisses: number;
    poidsBrutTotal: Prisma.Decimal;
    poidsTareTotal: Prisma.Decimal;
    poidsNetTotal: Prisma.Decimal;
    poidsBrutMoyen: Prisma.Decimal;
    poidsNetMoyen: Prisma.Decimal;
}

const peseeInclude = {
    Livraison: {
        select: {
            id: true,
            numeroLot: true,
            dateLivraison: true,
            Agriculteur: {
                select: { id: true, code: true, nom: true, prenom: true },
            },
        },
    },
    TypeCaisse: {
        select: { id: true, nom: true },
    },
    TypeDate: {
        select: { id: true, nom: true },
    },
    Caisses: {
        orderBy: { ordre: "asc" as const },
    },
};

/**
 * Repository pour gérer les pesées par type de caisse (une session de pesée par
 * type de caisse et par livraison, avec le détail de chaque caisse individuelle)
 */
export const peseeRepository = {
    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.pesee.findMany({
            where: { tenantId, ...(opts?.saisonId && { Livraison: { saisonId: opts.saisonId } }) },
            include: peseeInclude,
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Une page de livraisons pesées, chacune accompagnée de ses pesées.
     *
     * Tri par défaut sur `Livraison.createdAt` décroissant. La colonne affichée
     * « Date pesée » est le maximum des `Pesee.createdAt` de la livraison ; aucun
     * `ORDER BY` Prisma ne l'exprime, et comme les pesées sont créées avec la
     * livraison par l'assistant, les deux ordres coïncident en pratique.
     */
    async findPageParLivraison(
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
        const where = buildLivraisonPeseeWhere(tenantId, params.search, params.saisonId);
        const orderBy = resolveOrderBy<Prisma.LivraisonOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_LIVRAISON_PESEE,
            (dir) => ({ createdAt: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.livraison.findMany({
                    where,
                    select: LIVRAISON_PESEE_SELECT,
                    orderBy,
                    skip,
                    take,
                }),
            () => prisma.livraison.count({ where })
        );
    },

    /**
     * Totaux du jeu FILTRÉ, agrégés en base sur les `Pesee` — et non sur les
     * lignes de la page, ce qui donnerait les totaux des dix livraisons visibles
     * en les présentant comme ceux de la campagne.
     */
    async getTotauxFiltres(tenantId: string, params: { search: string; saisonId?: string }) {
        const whereLivraison = buildLivraisonPeseeWhere(tenantId, params.search, params.saisonId);

        const agg = await prisma.pesee.aggregate({
            where: { tenantId, Livraison: whereLivraison },
            _count: { _all: true },
            _sum: { poidsBrutTotal: true, poidsTareTotal: true, poidsNetTotal: true },
        });

        const nombre = (valeur: Prisma.Decimal | null) => (valeur ? valeur.toNumber() : 0);

        return {
            totalPesees: agg._count._all,
            poidsBrutTotal: nombre(agg._sum.poidsBrutTotal),
            poidsTareTotal: nombre(agg._sum.poidsTareTotal),
            poidsNetTotal: nombre(agg._sum.poidsNetTotal),
        };
    },

    async findById(tenantId: string, id: string) {
        return prisma.pesee.findFirst({
            where: { id, tenantId },
            include: peseeInclude,
        });
    },

    async findByLivraisonId(tenantId: string, livraisonId: string) {
        return prisma.pesee.findMany({
            where: { livraisonId, tenantId },
            include: peseeInclude,
            orderBy: { createdAt: "asc" },
        });
    },

    async findByLivraisonTypeCaisseAndTypeDate(
        tenantId: string,
        livraisonId: string,
        typeCaisseId: string,
        typeDateId: string
    ) {
        return prisma.pesee.findFirst({
            where: { livraisonId, typeCaisseId, typeDateId, tenantId },
        });
    },

    /**
     * Crée une session de pesée avec toutes ses caisses en une seule écriture atomique.
     * Les Pesee ne sont jamais créées manuellement par un utilisateur : elles sont
     * toujours générées automatiquement à partir d'une Livraison (voir livraison-pesee.service.ts).
     */
    async create(
        tenantId: string,
        livraisonId: string,
        agriculteurId: string,
        typeCaisseId: string,
        typeDateId: string,
        tareKg: number,
        grossWeights: number[],
        totals: PeseeTotals,
        prixKg: number,
        quantiteAcceptee: number,
        client: DbClient = prisma,
        /**
         * Caisses réellement remises au stock par le retour automatique.
         * Nécessaire pour pouvoir annuler ce retour à l'identique si la
         * livraison est supprimée.
         */
        caissesRetournees = 0
    ) {
        return client.pesee.create({
            data: {
                id: createId(),
                tenantId,
                livraisonId,
                agriculteurId,
                typeCaisseId,
                typeDateId,
                tareKg,
                nombreCaisses: totals.nombreCaisses,
                poidsBrutTotal: totals.poidsBrutTotal,
                poidsTareTotal: totals.poidsTareTotal,
                poidsNetTotal: totals.poidsNetTotal,
                poidsBrutMoyen: totals.poidsBrutMoyen,
                poidsNetMoyen: totals.poidsNetMoyen,
                prixKg,
                quantiteAcceptee,
                caissesRetournees,
                createdAt: new Date(),
                Caisses: {
                    create: grossWeights.map((poidsBrut, index) => ({
                        id: createId(),
                        poidsBrut,
                        ordre: index + 1,
                    })),
                },
            },
            include: peseeInclude,
        });
    },

    /**
     * Remplace les caisses d'une session de pesée existante et recalcule ses totaux.
     * Utilisé uniquement par la resynchronisation automatique depuis une Livraison modifiée.
     */
    async update(
        tenantId: string,
        id: string,
        tareKg: number,
        grossWeights: number[],
        totals: PeseeTotals,
        prixKg: number,
        quantiteAcceptee: number,
        client: DbClient = prisma
    ) {
        const existing = await client.pesee.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return client.pesee.update({
            where: { id },
            data: {
                tareKg,
                nombreCaisses: totals.nombreCaisses,
                poidsBrutTotal: totals.poidsBrutTotal,
                poidsTareTotal: totals.poidsTareTotal,
                poidsNetTotal: totals.poidsNetTotal,
                poidsBrutMoyen: totals.poidsBrutMoyen,
                poidsNetMoyen: totals.poidsNetMoyen,
                prixKg,
                quantiteAcceptee,
                Caisses: {
                    deleteMany: {},
                    create: grossWeights.map((poidsBrut, index) => ({
                        id: createId(),
                        poidsBrut,
                        ordre: index + 1,
                    })),
                },
            },
            include: peseeInclude,
        });
    },

    /**
     * Crée ou met à jour la Pesee d'une ligne (livraisonId, typeCaisseId, typeDateId).
     * Point d'entrée unique utilisé par la resynchronisation automatique lors de la
     * modification d'une livraison.
     */
    async upsertForLigne(
        tenantId: string,
        livraisonId: string,
        agriculteurId: string,
        typeCaisseId: string,
        typeDateId: string,
        tareKg: number,
        grossWeights: number[],
        totals: PeseeTotals,
        prixKg: number,
        quantiteAcceptee: number,
        client: DbClient = prisma
    ) {
        const existing = await client.pesee.findFirst({
            where: { tenantId, livraisonId, typeCaisseId, typeDateId },
        });

        if (existing) {
            return this.update(tenantId, existing.id, tareKg, grossWeights, totals, prixKg, quantiteAcceptee, client);
        }

        return this.create(
            tenantId,
            livraisonId,
            agriculteurId,
            typeCaisseId,
            typeDateId,
            tareKg,
            grossWeights,
            totals,
            prixKg,
            quantiteAcceptee,
            client
        );
    },

    /**
     * Supprime les Pesee d'une livraison dont la combinaison (typeCaisseId, typeDateId)
     * n'est plus présente dans les lignes conservées — utilisé lors d'une modification
     * de livraison qui retire des lignes.
     */
    async deleteObsoleteLignes(
        tenantId: string,
        livraisonId: string,
        keepKeys: { typeCaisseId: string; typeDateId: string }[],
        client: DbClient = prisma
    ) {
        const existing = await client.pesee.findMany({
            where: { tenantId, livraisonId },
            select: { id: true, typeCaisseId: true, typeDateId: true },
        });

        const keepSet = new Set(keepKeys.map((k) => `${k.typeCaisseId}::${k.typeDateId}`));
        const toDelete = existing.filter((p) => !keepSet.has(`${p.typeCaisseId}::${p.typeDateId}`));

        if (toDelete.length === 0) return;

        await client.pesee.deleteMany({
            where: { id: { in: toDelete.map((p) => p.id) } },
        });
    },

    async delete(tenantId: string, id: string, client: DbClient = prisma) {
        const existing = await client.pesee.findFirst({ where: { id, tenantId } });
        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return client.pesee.delete({ where: { id } });
    },

    async count(tenantId: string) {
        return prisma.pesee.count({ where: { tenantId } });
    },
};
