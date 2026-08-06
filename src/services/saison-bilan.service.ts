import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

export interface StockFinalTypeDate {
    typeDateId: string;
    nom: string;
    quantiteDisponible: number;
}

export interface StockCaisseType {
    typeCaisseId: string;
    nom: string;
    nombrePrete: number;
    nombreRetourne: number;
    nombreNonRetourne: number;
}

export interface IndicateursSaison {
    nombreLivraisons: number;
    totalQuantiteLivree: number;
    totalQuantiteAcceptee: number;

    totalAchatsMontant: number;
    quantitePayable: number;
    totalPaiementsAgriculteurs: number;
    soldeAgriculteursRestant: number;

    totalVentesQuantite: number;
    chiffreAffairesVentes: number;
    totalEncaissements: number;
    creancesClientsRestantes: number;

    totalDepensesAutres: number;

    tresorerie: number;
    margeBrute: number;
    margeNette: number;

    stockFinalParTypeDate: StockFinalTypeDate[];
    stockCaisses: StockCaisseType[];
}

/**
 * Calcule tous les indicateurs du bilan d'une saison, en lecture seule.
 * Réutilisée à la fois par l'aperçu de clôture (sans effet de bord) et par
 * la transaction de clôture (dont le résultat est persisté tel quel dans
 * BilanSaison) — logique unique, jamais dupliquée.
 *
 * Les flux (livraisons, achats, paiements, ventes, encaissements, dépenses)
 * sont filtrés par saisonId. Le stock (StockDate) et les caisses
 * (PretCaisse) n'ont pas de saisonId propre dans le schéma actuel : leurs
 * indicateurs sont donc des snapshots globaux du tenant au moment du calcul,
 * pas un sous-ensemble de la saison.
 */
export async function computeIndicateursSaison(
    tenantId: string,
    saisonId: string,
    client: DbClient = prisma
): Promise<IndicateursSaison> {
    const [
        livraisonAgg,
        bonsAchat,
        paiementsAgg,
        venteAgg,
        encaissementsAgg,
        depensesAgg,
        stockDateRows,
        pretCaisseRows,
    ] = await Promise.all([
        client.livraison.aggregate({
            where: { tenantId, saisonId },
            _count: { _all: true },
            _sum: { quantiteLivree: true, quantiteAcceptee: true },
        }),
        client.bonAchat.findMany({
            where: { tenantId, saisonId },
            select: { montant: true, PaiementAgriculteur: { select: { montant: true } } },
        }),
        client.paiementAgriculteur.aggregate({
            where: { tenantId, saisonId },
            _sum: { montant: true },
        }),
        client.vente.aggregate({
            where: { tenantId, saisonId },
            _sum: { quantite: true, montant: true },
        }),
        client.encaissementClient.aggregate({
            where: { tenantId, saisonId },
            _sum: { montant: true },
        }),
        client.depenseAutre.aggregate({
            where: { tenantId, saisonId },
            _sum: { montant: true },
        }),
        client.stockDate.findMany({
            where: { tenantId },
            select: { quantiteDisponible: true, typeDateId: true, TypeDate: { select: { nom: true } } },
        }),
        client.pretCaisse.findMany({
            where: { tenantId },
            select: {
                nombrePrete: true,
                nombreRetourne: true,
                typeCaisseId: true,
                TypeCaisse: { select: { nom: true } },
            },
        }),
    ]);

    const nombreLivraisons = livraisonAgg._count._all;
    const totalQuantiteLivree = livraisonAgg._sum.quantiteLivree ?? 0;
    const totalQuantiteAcceptee = livraisonAgg._sum.quantiteAcceptee ?? 0;

    const totalAchatsMontant = bonsAchat.reduce((sum, ba) => sum + ba.montant, 0);
    const totalPaiementsAgriculteurs = paiementsAgg._sum.montant ?? 0;
    const soldeAgriculteursRestant = bonsAchat.reduce((sum, ba) => {
        const paye = ba.PaiementAgriculteur.reduce((s, p) => s + p.montant, 0);
        return sum + (ba.montant - paye);
    }, 0);

    const totalVentesQuantite = venteAgg._sum.quantite ?? 0;
    const chiffreAffairesVentes = venteAgg._sum.montant ?? 0;
    const totalEncaissements = encaissementsAgg._sum.montant ?? 0;

    // Créances clients de cette saison : ventes de la saison moins les
    // encaissements liés (même logique que financeRepository.getCreancesClients,
    // restreinte à saisonId).
    const ventesSaison = await client.vente.findMany({
        where: { tenantId, saisonId, statut: { not: "PAYE" } },
        select: { montant: true, EncaissementClient: { select: { montant: true } } },
    });
    const creancesClientsRestantes = ventesSaison.reduce((sum, v) => {
        const encaisse = v.EncaissementClient.reduce((s, e) => s + e.montant, 0);
        return sum + (v.montant - encaisse);
    }, 0);

    const totalDepensesAutres = depensesAgg._sum.montant ?? 0;

    const tresorerie = totalEncaissements - totalPaiementsAgriculteurs - totalDepensesAutres;
    const margeBrute = chiffreAffairesVentes - totalAchatsMontant;
    const margeNette = margeBrute - totalDepensesAutres;

    const stockParType = new Map<string, StockFinalTypeDate>();
    for (const row of stockDateRows) {
        const existing = stockParType.get(row.typeDateId);
        if (existing) {
            existing.quantiteDisponible += row.quantiteDisponible;
        } else {
            stockParType.set(row.typeDateId, {
                typeDateId: row.typeDateId,
                nom: row.TypeDate.nom,
                quantiteDisponible: row.quantiteDisponible,
            });
        }
    }

    const caissesParType = new Map<string, StockCaisseType>();
    for (const row of pretCaisseRows) {
        const existing = caissesParType.get(row.typeCaisseId);
        if (existing) {
            existing.nombrePrete += row.nombrePrete;
            existing.nombreRetourne += row.nombreRetourne;
            existing.nombreNonRetourne += row.nombrePrete - row.nombreRetourne;
        } else {
            caissesParType.set(row.typeCaisseId, {
                typeCaisseId: row.typeCaisseId,
                nom: row.TypeCaisse.nom,
                nombrePrete: row.nombrePrete,
                nombreRetourne: row.nombreRetourne,
                nombreNonRetourne: row.nombrePrete - row.nombreRetourne,
            });
        }
    }

    return {
        nombreLivraisons,
        totalQuantiteLivree,
        totalQuantiteAcceptee,
        totalAchatsMontant,
        quantitePayable: totalQuantiteAcceptee,
        totalPaiementsAgriculteurs,
        soldeAgriculteursRestant,
        totalVentesQuantite,
        chiffreAffairesVentes,
        totalEncaissements,
        creancesClientsRestantes,
        totalDepensesAutres,
        tresorerie,
        margeBrute,
        margeNette,
        stockFinalParTypeDate: Array.from(stockParType.values()),
        stockCaisses: Array.from(caissesParType.values()),
    };
}
