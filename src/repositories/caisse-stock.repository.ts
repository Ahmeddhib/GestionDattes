import type { Prisma, ProprietaireCaisse, TypeMouvementCaisse, DirectionMouvementCaisse } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { paginate, resolveOrderBy, type SortDirection } from "@/lib/pagination";

export type CaisseDbClient = typeof prisma | Prisma.TransactionClient;

export interface CaisseSource {
    proprietaire: ProprietaireCaisse;
    clientProprietaireId?: string;
    typeCaisseId: string;
    quantite: number;
}

export async function incrementerStockProprietaire(
    tx: Prisma.TransactionClient,
    tenantId: string,
    source: CaisseSource
) {
    if (source.proprietaire === "WAKALA") {
        return tx.stockCaisseWakala.upsert({
            where: { tenantId_typeCaisseId: { tenantId, typeCaisseId: source.typeCaisseId } },
            create: { tenantId, typeCaisseId: source.typeCaisseId, quantite: source.quantite },
            update: { quantite: { increment: source.quantite } },
        });
    }

    if (!source.clientProprietaireId) throw new Error("Le propriétaire client est requis");
    return tx.stockCaisseClient.upsert({
        where: {
            tenantId_clientId_typeCaisseId: {
                tenantId,
                clientId: source.clientProprietaireId,
                typeCaisseId: source.typeCaisseId,
            },
        },
        create: {
            tenantId,
            clientId: source.clientProprietaireId,
            typeCaisseId: source.typeCaisseId,
            quantite: source.quantite,
        },
        update: { quantite: { increment: source.quantite } },
    });
}

/** Débit conditionnel : protège l'invariant stock >= 0 même en concurrence. */
export async function decrementerStockProprietaire(
    tx: Prisma.TransactionClient,
    tenantId: string,
    source: CaisseSource
) {
    const resultat = source.proprietaire === "WAKALA"
        ? await tx.stockCaisseWakala.updateMany({
            where: { tenantId, typeCaisseId: source.typeCaisseId, quantite: { gte: source.quantite } },
            data: { quantite: { decrement: source.quantite } },
        })
        : source.clientProprietaireId
            ? await tx.stockCaisseClient.updateMany({
                where: {
                    tenantId,
                    clientId: source.clientProprietaireId,
                    typeCaisseId: source.typeCaisseId,
                    quantite: { gte: source.quantite },
                },
                data: { quantite: { decrement: source.quantite } },
            })
            : { count: 0 };

    if (resultat.count !== 1) {
        throw new Error(`Stock de caisses insuffisant pour la source ${source.proprietaire}`);
    }
}

export async function creerMouvementCaisse(
    tx: Prisma.TransactionClient,
    data: {
        tenantId: string;
        createdById: string;
        source: CaisseSource;
        type: TypeMouvementCaisse;
        direction: DirectionMouvementCaisse;
        receptionId?: string;
        venteId?: string;
        pretCaisseId?: string;
        peseeId?: string;
        reference?: string;
        description?: string;
    }
) {
    return tx.mouvementCaisse.create({
        data: {
            tenantId: data.tenantId,
            createdById: data.createdById,
            typeCaisseId: data.source.typeCaisseId,
            proprietaire: data.source.proprietaire,
            clientProprietaireId: data.source.clientProprietaireId,
            quantite: data.source.quantite,
            type: data.type,
            direction: data.direction,
            receptionId: data.receptionId,
            venteId: data.venteId,
            pretCaisseId: data.pretCaisseId,
            peseeId: data.peseeId,
            reference: data.reference,
            description: data.description,
        },
    });
}

const mouvementSorts: Record<string, (direction: SortDirection) => Prisma.MouvementCaisseOrderByWithRelationInput> = {
    date: (direction) => ({ createdAt: direction }),
    quantite: (direction) => ({ quantite: direction }),
    type: (direction) => ({ type: direction }),
};

export const caisseStockRepository = {
    async getSituationsClients(tenantId: string, clientIds: string[]) {
        const ids = [...new Set(clientIds)];
        if (ids.length === 0) return [];

        const [stocks, mouvements] = await Promise.all([
            prisma.stockCaisseClient.findMany({
                where: { tenantId, clientId: { in: ids } },
                select: {
                    clientId: true,
                    typeCaisseId: true,
                    quantite: true,
                    TypeCaisse: { select: { nom: true } },
                },
            }),
            prisma.mouvementCaisse.groupBy({
                by: ["clientProprietaireId", "typeCaisseId", "type"],
                where: { tenantId, clientProprietaireId: { in: ids } },
                _sum: { quantite: true },
            }),
        ]);

        return stocks.map((stock) => ({
            clientId: stock.clientId,
            typeCaisseId: stock.typeCaisseId,
            typeCaisse: stock.TypeCaisse.nom,
            apportees: mouvements.find((m) =>
                m.clientProprietaireId === stock.clientId &&
                m.typeCaisseId === stock.typeCaisseId &&
                m.type === "RECEPTION_CLIENT"
            )?._sum.quantite ?? 0,
            sortiesVente: mouvements.find((m) =>
                m.clientProprietaireId === stock.clientId &&
                m.typeCaisseId === stock.typeCaisseId &&
                m.type === "SORTIE_VENTE"
            )?._sum.quantite ?? 0,
            solde: stock.quantite,
        }));
    },

    async getVueGlobale(tenantId: string) {
        const [wakala, clients, prets, types] = await Promise.all([
            prisma.stockCaisseWakala.aggregate({ where: { tenantId }, _sum: { quantite: true } }),
            prisma.stockCaisseClient.aggregate({ where: { tenantId }, _sum: { quantite: true } }),
            prisma.pretCaisse.aggregate({
                where: { tenantId, statut: { in: ["EN_COURS", "INCOMPLET"] } },
                _sum: { nombrePrete: true, nombreRetourne: true },
            }),
            prisma.typeCaisse.findMany({
                where: { tenantId },
                select: {
                    id: true,
                    nom: true,
                    poidsKg: true,
                    StockCaisseWakala: { where: { tenantId }, select: { quantite: true } },
                    StockCaisseClient: {
                        where: { tenantId },
                        select: { quantite: true, Client: { select: { id: true, nom: true } } },
                    },
                },
                orderBy: { nom: "asc" },
            }),
        ]);

        const stockWakala = wakala._sum.quantite ?? 0;
        const stockClients = clients._sum.quantite ?? 0;
        return {
            kpis: {
                stockPhysique: stockWakala + stockClients,
                stockWakala,
                stockClients,
                pretsEnCours: (prets._sum.nombrePrete ?? 0) - (prets._sum.nombreRetourne ?? 0),
            },
            parType: types.map((type) => {
                const quantiteWakala = type.StockCaisseWakala[0]?.quantite ?? 0;
                const proprietairesClients = type.StockCaisseClient.map((stock) => ({
                    clientId: stock.Client.id,
                    client: stock.Client.nom,
                    quantite: stock.quantite,
                }));
                const quantiteClients = proprietairesClients.reduce((somme, stock) => somme + stock.quantite, 0);
                return {
                    id: type.id,
                    nom: type.nom,
                    poidsKg: type.poidsKg,
                    quantiteWakala,
                    quantiteClients,
                    quantiteTotale: quantiteWakala + quantiteClients,
                    proprietairesClients,
                };
            }),
        };
    },

    async getReceptionsPage(tenantId: string, params: {
        page: number; pageSize: number; search: string; sortBy: string; sortDir: SortDirection;
        clientId?: string; from?: Date; to?: Date;
    }) {
        const where: Prisma.ReceptionCaissesWhereInput = {
            tenantId,
            ...(params.clientId && { clientId: params.clientId }),
            ...((params.from || params.to) && { date: { gte: params.from, lte: params.to } }),
            ...(params.search && { OR: [
                { numero: { contains: params.search, mode: "insensitive" } },
                { matriculeCamion: { contains: params.search, mode: "insensitive" } },
                { chauffeur: { contains: params.search, mode: "insensitive" } },
                { Client: { nom: { contains: params.search, mode: "insensitive" } } },
            ] }),
        };
        const orderBy: Prisma.ReceptionCaissesOrderByWithRelationInput =
            params.sortBy === "numero" ? { numero: params.sortDir } : { date: params.sortDir };
        return paginate(
            params.page,
            params.pageSize,
            (skip, take) => prisma.receptionCaisses.findMany({
                where,
                include: {
                    Client: { select: { id: true, nom: true } },
                    CreatedBy: { select: { id: true, name: true } },
                    Lignes: { include: { TypeCaisse: { select: { id: true, nom: true } } } },
                },
                orderBy,
                skip,
                take,
            }),
            () => prisma.receptionCaisses.count({ where })
        );
    },

    async getMouvementsPage(tenantId: string, params: {
        page: number; pageSize: number; search: string; sortBy: string; sortDir: SortDirection;
        clientId?: string; typeCaisseId?: string; proprietaire?: ProprietaireCaisse;
        type?: TypeMouvementCaisse; from?: Date; to?: Date;
    }) {
        const where: Prisma.MouvementCaisseWhereInput = {
            tenantId,
            ...(params.clientId && { clientProprietaireId: params.clientId }),
            ...(params.typeCaisseId && { typeCaisseId: params.typeCaisseId }),
            ...(params.proprietaire && { proprietaire: params.proprietaire }),
            ...(params.type && { type: params.type }),
            ...((params.from || params.to) && { createdAt: { gte: params.from, lte: params.to } }),
            ...(params.search && { OR: [
                { reference: { contains: params.search, mode: "insensitive" } },
                { description: { contains: params.search, mode: "insensitive" } },
                { TypeCaisse: { nom: { contains: params.search, mode: "insensitive" } } },
                { ClientProprietaire: { nom: { contains: params.search, mode: "insensitive" } } },
            ] }),
        };
        const orderBy = resolveOrderBy(params.sortBy, params.sortDir, mouvementSorts, (direction) => ({ createdAt: direction }));
        return paginate(
            params.page,
            params.pageSize,
            (skip, take) => prisma.mouvementCaisse.findMany({
                where,
                include: {
                    TypeCaisse: { select: { id: true, nom: true } },
                    ClientProprietaire: { select: { id: true, nom: true } },
                    CreatedBy: { select: { id: true, name: true } },
                },
                orderBy,
                skip,
                take,
            }),
            () => prisma.mouvementCaisse.count({ where })
        );
    },

    async getStocksClientsPage(tenantId: string, params: {
        page: number; pageSize: number; search: string; clientId?: string; typeCaisseId?: string;
    }) {
        const where: Prisma.StockCaisseClientWhereInput = {
            tenantId,
            ...(params.clientId && { clientId: params.clientId }),
            ...(params.typeCaisseId && { typeCaisseId: params.typeCaisseId }),
            ...(params.search && { OR: [
                { Client: { nom: { contains: params.search, mode: "insensitive" } } },
                { TypeCaisse: { nom: { contains: params.search, mode: "insensitive" } } },
            ] }),
        };
        const page = await paginate(
            params.page,
            params.pageSize,
            (skip, take) => prisma.stockCaisseClient.findMany({
                where,
                include: { Client: true, TypeCaisse: true },
                orderBy: [{ Client: { nom: "asc" } }, { TypeCaisse: { nom: "asc" } }],
                skip,
                take,
            }),
            () => prisma.stockCaisseClient.count({ where })
        );

        const keys = page.items.map((item) => ({ clientId: item.clientId, typeCaisseId: item.typeCaisseId }));
        const [mouvements, derniersMouvements] = keys.length === 0
            ? [[], []]
            : await Promise.all([
                prisma.mouvementCaisse.groupBy({
                    by: ["clientProprietaireId", "typeCaisseId", "direction"],
                    where: {
                        tenantId,
                        OR: keys.map((key) => ({ clientProprietaireId: key.clientId, typeCaisseId: key.typeCaisseId })),
                    },
                    _sum: { quantite: true },
                }),
                prisma.mouvementCaisse.findMany({
                    where: {
                        tenantId,
                        OR: keys.map((key) => ({ clientProprietaireId: key.clientId, typeCaisseId: key.typeCaisseId })),
                    },
                    orderBy: { createdAt: "desc" },
                    distinct: ["clientProprietaireId", "typeCaisseId"],
                    select: { id: true, clientProprietaireId: true, typeCaisseId: true, type: true, direction: true, quantite: true, createdAt: true },
                }),
            ]);
        return {
            ...page,
            items: page.items.map((item) => ({
                ...item,
                totalEntrees: mouvements.find((m) => m.clientProprietaireId === item.clientId && m.typeCaisseId === item.typeCaisseId && m.direction === "ENTREE")?._sum.quantite ?? 0,
                totalSorties: mouvements.find((m) => m.clientProprietaireId === item.clientId && m.typeCaisseId === item.typeCaisseId && m.direction === "SORTIE")?._sum.quantite ?? 0,
                dernierMouvement: derniersMouvements.find((m) => m.clientProprietaireId === item.clientId && m.typeCaisseId === item.typeCaisseId) ?? null,
            })),
        };
    },
};
