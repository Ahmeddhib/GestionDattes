import { prisma } from "@/lib/prisma";

export type DateRangeFilter = { gte?: Date; lte?: Date };

function dateWhere(range?: DateRangeFilter) {
    if (!range || (!range.gte && !range.lte)) return undefined;
    return {
        ...(range.gte && { gte: range.gte }),
        ...(range.lte && { lte: range.lte }),
    };
}

/**
 * Requêtes d'agrégation pures pour le Bilan Financier Global. Rien n'est
 * jamais persisté ici — tout est recalculé à la demande, comme
 * nombreRestant sur PretCaisse.
 */
export const financeRepository = {
    async getTotalEncaissementsClients(tenantId: string, range?: DateRangeFilter) {
        const result = await prisma.encaissementClient.aggregate({
            where: { tenantId, ...(dateWhere(range) && { dateEncaissement: dateWhere(range) }) },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    async getTotalPaiementsAgriculteurs(tenantId: string, range?: DateRangeFilter) {
        const result = await prisma.paiementAgriculteur.aggregate({
            where: { tenantId, ...(dateWhere(range) && { datePaiement: dateWhere(range) }) },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    async getTotalDepensesAutres(tenantId: string, range?: DateRangeFilter) {
        const result = await prisma.depenseAutre.aggregate({
            where: { tenantId, ...(dateWhere(range) && { dateDepense: dateWhere(range) }) },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    async getTotalVentes(tenantId: string, range?: DateRangeFilter) {
        const result = await prisma.vente.aggregate({
            where: { tenantId, ...(dateWhere(range) && { date: dateWhere(range) }) },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    async getTotalAchats(tenantId: string, range?: DateRangeFilter) {
        const result = await prisma.bonAchat.aggregate({
            where: { tenantId, ...(dateWhere(range) && { createdAt: dateWhere(range) }) },
            _sum: { montant: true },
        });
        return result._sum.montant ?? 0;
    },

    /**
     * Créances clients : somme des restes à payer de toutes les ventes non
     * soldées. Solde de tout temps (pas borné par la période), comme
     * nombreRestant sur PretCaisse.
     */
    async getCreancesClients(tenantId: string) {
        const ventes = await prisma.vente.findMany({
            where: { tenantId, statut: { not: "PAYE" } },
            select: {
                id: true,
                montant: true,
                Client: { select: { id: true, nom: true } },
                EncaissementClient: { select: { montant: true } },
            },
        });

        const detail = ventes.map((v) => {
            const encaisse = v.EncaissementClient.reduce((sum, e) => sum + e.montant, 0);
            return { venteId: v.id, client: v.Client.nom, restant: v.montant - encaisse };
        });

        return {
            total: detail.reduce((sum, d) => sum + d.restant, 0),
            detail: detail.sort((a, b) => b.restant - a.restant).slice(0, 10),
        };
    },

    /**
     * Dettes agriculteurs : somme des restes à payer de tous les bons
     * d'achat non soldés. Solde de tout temps, pas borné par la période.
     */
    async getDettesAgriculteurs(tenantId: string) {
        const bonsAchat = await prisma.bonAchat.findMany({
            where: { tenantId, statut: { not: "PAYE" } },
            select: {
                id: true,
                montant: true,
                Livraison: { select: { Agriculteur: { select: { id: true, nom: true, prenom: true } } } },
                PaiementAgriculteur: { select: { montant: true } },
            },
        });

        const detail = bonsAchat.map((ba) => {
            const paye = ba.PaiementAgriculteur.reduce((sum, p) => sum + p.montant, 0);
            return {
                bonAchatId: ba.id,
                agriculteur: `${ba.Livraison.Agriculteur.nom} ${ba.Livraison.Agriculteur.prenom}`,
                restant: ba.montant - paye,
            };
        });

        return {
            total: detail.reduce((sum, d) => sum + d.restant, 0),
            detail: detail.sort((a, b) => b.restant - a.restant).slice(0, 10),
        };
    },
};
