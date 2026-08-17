import { prisma } from "@/lib/prisma";

/**
 * Filtre de période pour les agrégats du dashboard : soit une saison exacte,
 * soit une plage de dates entièrement bornée (toujours produite par
 * `resolvePeriodFilter` du module Finance — jamais de bornes partielles ici).
 */
export type TrendFilter = { saisonId: string } | { dateFrom: Date; dateTo: Date };

function livraisonWhere(tenantId: string, filter: TrendFilter) {
    if ("saisonId" in filter) {
        return { tenantId, saisonId: filter.saisonId };
    }
    return { tenantId, dateLivraison: { gte: filter.dateFrom, lte: filter.dateTo } };
}

function peseeLivraisonWhere(tenantId: string, filter: TrendFilter) {
    if ("saisonId" in filter) {
        return { tenantId, Livraison: { saisonId: filter.saisonId } };
    }
    return { tenantId, Livraison: { dateLivraison: { gte: filter.dateFrom, lte: filter.dateTo } } };
}

type Granularity = "day" | "month";

/**
 * Requêtes d'agrégation lecture-seule pour le dashboard, qui ne recoupent
 * aucune agrégation déjà exposée ailleurs (Finance, Saison). Toujours
 * filtrées par tenantId ; jamais de tri/valeur venant du client sans
 * validation préalable côté service.
 */
export const dashboardRepository = {
    /** Totaux livraisons bornés à une période exacte (distinct de `getStatistics`, qui est tenant-wide). */
    async getLivraisonsSummary(tenantId: string, filter: TrendFilter) {
        const result = await prisma.livraison.aggregate({
            where: livraisonWhere(tenantId, filter),
            _count: { _all: true },
            _sum: { quantiteLivree: true, quantiteAcceptee: true },
        });
        return {
            nombreLivraisons: result._count._all,
            quantiteLivree: result._sum.quantiteLivree ?? 0,
            quantiteAcceptee: result._sum.quantiteAcceptee ?? 0,
        };
    },

    async getLivraisonsTrend(tenantId: string, filter: TrendFilter, granularity: Granularity) {
        if ("saisonId" in filter) {
            return prisma.$queryRaw<Array<{ periode: Date; poidsNet: number; quantitePayable: number; nombreLivraisons: bigint }>>`
                SELECT date_trunc(${granularity}, "dateLivraison") AS periode,
                       COALESCE(SUM("quantiteLivree"), 0)::float AS "poidsNet",
                       COALESCE(SUM("quantiteAcceptee"), 0)::float AS "quantitePayable",
                       COUNT(*) AS "nombreLivraisons"
                FROM "Livraison"
                WHERE "tenantId" = ${tenantId} AND "saisonId" = ${filter.saisonId}
                GROUP BY periode
                ORDER BY periode ASC
            `;
        }
        return prisma.$queryRaw<Array<{ periode: Date; poidsNet: number; quantitePayable: number; nombreLivraisons: bigint }>>`
            SELECT date_trunc(${granularity}, "dateLivraison") AS periode,
                   COALESCE(SUM("quantiteLivree"), 0)::float AS "poidsNet",
                   COALESCE(SUM("quantiteAcceptee"), 0)::float AS "quantitePayable",
                   COUNT(*) AS "nombreLivraisons"
            FROM "Livraison"
            WHERE "tenantId" = ${tenantId} AND "dateLivraison" BETWEEN ${filter.dateFrom} AND ${filter.dateTo}
            GROUP BY periode
            ORDER BY periode ASC
        `;
    },

    async getCashFlowTrend(tenantId: string, filter: TrendFilter, granularity: Granularity) {
        const [encaissements, paiements, depenses] = await Promise.all([
            "saisonId" in filter
                ? prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "dateEncaissement") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "EncaissementClient" WHERE "tenantId" = ${tenantId} AND "saisonId" = ${filter.saisonId}
                    GROUP BY periode ORDER BY periode ASC`
                : prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "dateEncaissement") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "EncaissementClient" WHERE "tenantId" = ${tenantId} AND "dateEncaissement" BETWEEN ${filter.dateFrom} AND ${filter.dateTo}
                    GROUP BY periode ORDER BY periode ASC`,
            "saisonId" in filter
                ? prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "datePaiement") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "PaiementAgriculteur" WHERE "tenantId" = ${tenantId} AND "saisonId" = ${filter.saisonId}
                    GROUP BY periode ORDER BY periode ASC`
                : prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "datePaiement") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "PaiementAgriculteur" WHERE "tenantId" = ${tenantId} AND "datePaiement" BETWEEN ${filter.dateFrom} AND ${filter.dateTo}
                    GROUP BY periode ORDER BY periode ASC`,
            "saisonId" in filter
                ? prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "dateDepense") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "DepenseAutre" WHERE "tenantId" = ${tenantId} AND "saisonId" = ${filter.saisonId}
                    GROUP BY periode ORDER BY periode ASC`
                : prisma.$queryRaw<Array<{ periode: Date; total: number }>>`
                    SELECT date_trunc(${granularity}, "dateDepense") AS periode, COALESCE(SUM(montant), 0)::float AS total
                    FROM "DepenseAutre" WHERE "tenantId" = ${tenantId} AND "dateDepense" BETWEEN ${filter.dateFrom} AND ${filter.dateTo}
                    GROUP BY periode ORDER BY periode ASC`,
        ]);

        return { encaissements, paiements, depenses };
    },

    async getSalesTrend(tenantId: string, filter: TrendFilter, granularity: Granularity) {
        if ("saisonId" in filter) {
            return prisma.$queryRaw<Array<{ periode: Date; quantite: number; montant: number }>>`
                SELECT date_trunc(${granularity}, "date") AS periode,
                       COALESCE(SUM(quantite), 0)::float AS quantite,
                       COALESCE(SUM(montant), 0)::float AS montant
                FROM "Vente"
                WHERE "tenantId" = ${tenantId} AND "saisonId" = ${filter.saisonId}
                GROUP BY periode
                ORDER BY periode ASC
            `;
        }
        return prisma.$queryRaw<Array<{ periode: Date; quantite: number; montant: number }>>`
            SELECT date_trunc(${granularity}, "date") AS periode,
                   COALESCE(SUM(quantite), 0)::float AS quantite,
                   COALESCE(SUM(montant), 0)::float AS montant
            FROM "Vente"
            WHERE "tenantId" = ${tenantId} AND "date" BETWEEN ${filter.dateFrom} AND ${filter.dateTo}
            GROUP BY periode
            ORDER BY periode ASC
        `;
    },

    /** Instantané courant, jamais filtré par période (le stock n'a pas d'historique). */
    async getStockParTypeDate(tenantId: string) {
        const [sums, types] = await Promise.all([
            prisma.stockDate.groupBy({
                by: ["typeDateId"],
                where: { tenantId },
                _sum: { quantiteDisponible: true },
            }),
            prisma.typeDate.findMany({
                where: { tenantId },
                select: { id: true, nom: true, seuilAlerte: true },
                orderBy: { nom: "asc" },
            }),
        ]);

        const sumByType = new Map(sums.map((s) => [s.typeDateId, s._sum.quantiteDisponible ?? 0]));

        return types.map((t) => ({
            typeDateId: t.id,
            nom: t.nom,
            quantiteDisponible: sumByType.get(t.id) ?? 0,
            seuilAlerte: t.seuilAlerte,
        }));
    },

    async getRepartitionLivraisonsParTypeDate(tenantId: string, filter: TrendFilter) {
        const [sums, types] = await Promise.all([
            prisma.pesee.groupBy({
                by: ["typeDateId"],
                where: peseeLivraisonWhere(tenantId, filter),
                _sum: { poidsNetTotal: true },
            }),
            prisma.typeDate.findMany({ where: { tenantId }, select: { id: true, nom: true } }),
        ]);

        const nomById = new Map(types.map((t) => [t.id, t.nom]));

        return sums
            .map((s) => ({
                typeDateId: s.typeDateId,
                nom: nomById.get(s.typeDateId) ?? "—",
                quantite: Number(s._sum.poidsNetTotal ?? 0),
            }))
            .filter((s) => s.quantite > 0)
            .sort((a, b) => b.quantite - a.quantite);
    },

    async getTopAgriculteurs(tenantId: string, filter: TrendFilter, limit: number) {
        const grouped = await prisma.livraison.groupBy({
            by: ["agriculteurId"],
            where: livraisonWhere(tenantId, filter),
            _sum: { quantiteLivree: true },
            _count: { _all: true },
            orderBy: { _sum: { quantiteLivree: "desc" } },
            take: limit,
        });

        if (grouped.length === 0) return [];

        const agriculteurs = await prisma.agriculteur.findMany({
            where: { id: { in: grouped.map((g) => g.agriculteurId) }, tenantId },
            select: { id: true, nom: true, prenom: true },
        });
        const nomById = new Map(agriculteurs.map((a) => [a.id, `${a.nom} ${a.prenom}`]));

        return grouped.map((g) => ({
            agriculteurId: g.agriculteurId,
            nom: nomById.get(g.agriculteurId) ?? "—",
            quantiteLivree: g._sum.quantiteLivree ?? 0,
            nombreLivraisons: g._count._all,
        }));
    },

    /** Instantané courant, jamais filtré par période. */
    async getCaissesNonRetournees(tenantId: string) {
        const [sums, types] = await Promise.all([
            prisma.pretCaisse.groupBy({
                by: ["typeCaisseId"],
                where: { tenantId },
                _sum: { nombrePrete: true, nombreRetourne: true },
            }),
            prisma.typeCaisse.findMany({ where: { tenantId }, select: { id: true, nom: true } }),
        ]);
        const nomById = new Map(types.map((t) => [t.id, t.nom]));

        return sums
            .map((s) => ({
                typeCaisseId: s.typeCaisseId,
                nom: nomById.get(s.typeCaisseId) ?? "—",
                nombreNonRetourne: (s._sum.nombrePrete ?? 0) - (s._sum.nombreRetourne ?? 0),
            }))
            .filter((s) => s.nombreNonRetourne > 0);
    },

    /** Compteurs bon marché pour les alertes — toujours "solde de tout temps", pas borné par période. */
    async getAlertesCounts(tenantId: string) {
        const [
            bonsAchatImpayes,
            ventesImpayees,
            pretsEnCours,
            livraisonsSansBonAchat,
            livraisonsSansPesee,
        ] = await Promise.all([
            prisma.bonAchat.count({ where: { tenantId, statut: { not: "PAYE" } } }),
            prisma.vente.count({ where: { tenantId, statut: { not: "PAYE" } } }),
            prisma.pretCaisse.count({ where: { tenantId, statut: { in: ["EN_COURS", "INCOMPLET"] } } }),
            prisma.livraison.count({ where: { tenantId, BonAchat: null } }),
            prisma.livraison.count({ where: { tenantId, Pesee: { none: {} } } }),
        ]);

        return { bonsAchatImpayes, ventesImpayees, pretsEnCours, livraisonsSansBonAchat, livraisonsSansPesee };
    },
};
