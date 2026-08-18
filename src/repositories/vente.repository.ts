import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

type DbClient = typeof prisma | Prisma.TransactionClient;

export interface FiltresVente {
    clientId?: string;
    statut?: "EN_ATTENTE" | "PARTIEL" | "PAYE";
    from?: Date;
    to?: Date;
}

/**
 * Colonnes triables, par identifiant de colonne du tableau.
 *
 * `montantRestant` en est absent : c'est `montant − Σ encaissements`, calculé
 * après lecture. Aucun `ORDER BY` ne l'exprime, et le proposer trierait sur
 * autre chose que ce que la colonne affiche.
 */
const TRIS_VENTE: Record<string, (dir: SortDirection) => Prisma.VenteOrderByWithRelationInput> = {
    Client: (dir) => ({ Client: { nom: dir } }),
    quantite: (dir) => ({ quantite: dir }),
    prixUnitaire: (dir) => ({ prixUnitaire: dir }),
    montant: (dir) => ({ montant: dir }),
    statut: (dir) => ({ statut: dir }),
    createdAt: (dir) => ({ createdAt: dir }),
};

function buildVenteWhere(
    tenantId: string,
    search: string,
    saisonId?: string,
    filtres?: FiltresVente
): Prisma.VenteWhereInput {
    return {
        tenantId,
        ...(saisonId && { saisonId }),
        ...(filtres?.clientId && { clientId: filtres.clientId }),
        ...(filtres?.statut && { statut: filtres.statut }),
        ...((filtres?.from || filtres?.to) && {
            createdAt: {
                ...(filtres.from && { gte: filtres.from }),
                ...(filtres.to && { lte: filtres.to }),
            },
        }),
        ...(search && {
            OR: [
                { Client: { nom: { contains: search, mode: "insensitive" as const } } },
                { StockDate: { Livraison: { numeroLot: { contains: search, mode: "insensitive" as const } } } },
                { StockDate: { TypeDate: { nom: { contains: search, mode: "insensitive" as const } } } },
            ],
        }),
    };
}

const VENTE_INCLUDE = {
    Client: { select: { id: true, nom: true, telephone: true, adresse: true, email: true } },
    StockDate: {
        select: {
            id: true,
            TypeDate: { select: { id: true, nom: true } },
            Livraison: { select: { id: true, numeroLot: true } },
        },
    },
    User: { select: { id: true, name: true } },
    Saison: { select: { id: true, nom: true } },
    // Conservé : le montant encaissé de CHAQUE ligne affichée en dépend, et une
    // vente n'a qu'une poignée d'encaissements. Ce sont les totaux d'en-tête qui
    // ne peuvent pas s'en déduire — d'où `getTotauxFiltres`.
    EncaissementClient: { select: { montant: true } },
} satisfies Prisma.VenteInclude;

export const venteRepository = {
    async findAll(tenantId: string, opts?: { saisonId?: string }) {
        return prisma.vente.findMany({
            where: { tenantId, ...(opts?.saisonId && { saisonId: opts.saisonId }) },
            include: VENTE_INCLUDE,
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
            filtres?: FiltresVente;
        }
    ) {
        const where = buildVenteWhere(tenantId, params.search, params.saisonId, params.filtres);
        const orderBy = resolveOrderBy<Prisma.VenteOrderByWithRelationInput>(
            params.sortBy,
            params.sortDir,
            TRIS_VENTE,
            (dir) => ({ createdAt: dir })
        );

        return paginate(
            params.page,
            params.pageSize,
            (skip, take) =>
                prisma.vente.findMany({ where, include: VENTE_INCLUDE, orderBy, skip, take }),
            () => prisma.vente.count({ where })
        );
    },

    /** Toutes les lignes du filtre courant, sans pagination — réservé à l'export. */
    async findAllFiltre(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresVente }
    ) {
        return prisma.vente.findMany({
            where: buildVenteWhere(tenantId, params.search, params.saisonId, params.filtres),
            include: VENTE_INCLUDE,
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Totaux du jeu FILTRÉ, agrégés en base.
     *
     * L'encaissé ne peut pas être sommé depuis les ventes : il vit dans
     * `EncaissementClient`. On agrège donc cette table en lui appliquant le MÊME
     * filtre, via la relation — sans quoi le total encaissé porterait sur toutes
     * les ventes alors que le chiffre d'affaires porterait sur le filtre.
     */
    async getTotauxFiltres(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresVente }
    ) {
        const where = buildVenteWhere(tenantId, params.search, params.saisonId, params.filtres);

        const [ventes, encaissements] = await Promise.all([
            prisma.vente.aggregate({ where, _count: { _all: true }, _sum: { montant: true } }),
            prisma.encaissementClient.aggregate({
                where: { tenantId, Vente: where },
                _sum: { montant: true },
            }),
        ]);

        const chiffreAffaires = ventes._sum.montant ?? 0;
        const totalEncaisse = encaissements._sum.montant ?? 0;

        return {
            total: ventes._count._all,
            chiffreAffaires,
            totalEncaisse,
            totalRestant: chiffreAffaires - totalEncaisse,
        };
    },

    /**
     * Clients ayant au moins une vente, pour alimenter le filtre.
     *
     * Déduire la liste des lignes affichées la réduisait à celles de la page :
     * le menu changeait de contenu à chaque changement de page.
     */
    async findClientsAvecVente(tenantId: string, saisonId?: string) {
        return prisma.client.findMany({
            where: {
                tenantId,
                Vente: { some: { tenantId, ...(saisonId && { saisonId }) } },
            },
            select: { id: true, nom: true },
            orderBy: { nom: "asc" },
        });
    },

    async findById(id: string, tenantId: string) {
        return prisma.vente.findFirst({
            where: { id, tenantId },
            include: VENTE_INCLUDE,
        });
    },

    async create(
        data: {
            quantite: number;
            prixUnitaire: number;
            montant: number;
            clientId: string;
            stockId: string;
            saisonId: string;
        },
        tenantId: string,
        createdById: string,
        client: DbClient = prisma
    ) {
        return client.vente.create({
            data: {
                id: createId(),
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant: data.montant,
                statut: "EN_ATTENTE",
                Client: { connect: { id: data.clientId } },
                StockDate: { connect: { id: data.stockId } },
                User: { connect: { id: createdById } },
                Tenant: { connect: { id: tenantId } },
                Saison: { connect: { id: data.saisonId } },
            },
        });
    },

    /**
     * Vente non réglée uniquement, avec le lot de stock associé — utilisé
     * pour valider et appliquer une correction de quantité/prix.
     */
    async findEditableById(id: string, tenantId: string, client: DbClient = prisma) {
        return client.vente.findFirst({
            where: { id, tenantId },
            include: { StockDate: true },
        });
    },

    async update(
        id: string,
        data: {
            quantite: number;
            prixUnitaire: number;
            montant: number;
            clientId: string;
        },
        client: DbClient = prisma
    ) {
        return client.vente.update({
            where: { id },
            data: {
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant: data.montant,
                clientId: data.clientId,
            },
        });
    },
};
