import * as XLSX from "xlsx";
import type { BilanSaisonForPdf, SaisonForPdf } from "./bilan-saison-pdf";

/**
 * Exporte le bilan de saison en Excel en ne lisant QUE les champs déjà
 * figés dans BilanSaison — aucune donnée n'est recalculée ici.
 */
export function exportBilanSaisonToExcel(bilan: BilanSaisonForPdf, saison: SaisonForPdf) {
    const estProvisoire = bilan.type === "PROVISOIRE";

    const indicateurs = [
        // En-tête d'identification : un fichier provisoire ne doit jamais être
        // confondu avec le bilan de clôture une fois détaché de l'application.
        {
            Indicateur: "Nature du bilan",
            Valeur: estProvisoire ? `PROVISOIRE (version ${bilan.version})` : "FINAL (clôture)",
        },
        { Indicateur: "Généré le", Valeur: bilan.genereAt.toLocaleDateString("fr-FR") },
        { Indicateur: "Nombre de livraisons", Valeur: bilan.nombreLivraisons },
        { Indicateur: "Quantité livrée (kg)", Valeur: bilan.totalQuantiteLivree },
        { Indicateur: "Quantité acceptée (kg)", Valeur: bilan.totalQuantiteAcceptee },
        { Indicateur: "Total achats (TND)", Valeur: bilan.totalAchatsMontant },
        { Indicateur: "Quantité payable (kg)", Valeur: bilan.quantitePayable },
        { Indicateur: "Total paiements agriculteurs (TND)", Valeur: bilan.totalPaiementsAgriculteurs },
        { Indicateur: "Solde agriculteurs restant (TND)", Valeur: bilan.soldeAgriculteursRestant },
        { Indicateur: "Quantité vendue (kg)", Valeur: bilan.totalVentesQuantite },
        { Indicateur: "Chiffre d'affaires (TND)", Valeur: bilan.chiffreAffairesVentes },
        { Indicateur: "Total encaissements (TND)", Valeur: bilan.totalEncaissements },
        { Indicateur: "Créances clients restantes (TND)", Valeur: bilan.creancesClientsRestantes },
        { Indicateur: "Total dépenses autres (TND)", Valeur: bilan.totalDepensesAutres },
        { Indicateur: "Trésorerie (TND)", Valeur: bilan.tresorerie },
        { Indicateur: "Marge brute (TND)", Valeur: bilan.margeBrute },
        { Indicateur: "Marge nette (TND)", Valeur: bilan.margeNette },
    ];

    const stockFinal = bilan.stockFinalParTypeDate.map((s) => ({
        Variété: s.nom,
        "Quantité disponible": s.quantiteDisponible,
    }));

    const caisses = bilan.stockCaisses.map((c) => ({
        "Type de caisse": c.nom,
        Prêtées: c.nombrePrete,
        Retournées: c.nombreRetourne,
        "Non retournées": c.nombreNonRetourne,
    }));

    // Stock attribuable à la saison, distinct de l'instantané physique global.
    const restantParType = new Map(
        bilan.stockOrigineRestantParTypeDate.map((s) => [s.typeDateId, s.quantiteDisponible])
    );
    const stockSaison = bilan.stockEntreParTypeDate.map((s) => ({
        Variété: s.nom,
        "Entré durant la saison": s.quantiteDisponible,
        "Restant au moment du calcul": restantParType.get(s.typeDateId) ?? 0,
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(indicateurs), "Bilan");
    if (stockFinal.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stockFinal), "Stock final");
    }
    if (stockSaison.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stockSaison), "Stock saison");
    }
    if (caisses.length > 0) {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(caisses), "Caisses");
    }

    const suffixe = estProvisoire ? `provisoire-v${bilan.version}` : "final";
    XLSX.writeFile(workbook, `bilan-saison-${saison.nom.replace(/\s+/g, "-")}-${suffixe}.xlsx`);
}
