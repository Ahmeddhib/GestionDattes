import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
    addBrandedPdfFooters,
    createBrandedPdf,
    PDF_DARK,
    type PdfBranding,
} from "@/lib/pdf-branding";

async function exportTablePdf(options: {
    title: string;
    fileName: string;
    head: string[];
    body: (string | number)[][];
    branding?: PdfBranding;
    orientation?: "portrait" | "landscape";
}) {
    const { doc, contentStartY } = await createBrandedPdf({
        title: options.title,
        branding: options.branding,
        reference: `RAPPORT — ${options.body.length} ligne${options.body.length > 1 ? "s" : ""}`,
        orientation: options.orientation ?? "landscape",
    });

    autoTable(doc, {
        head: [options.head],
        body: options.body,
        startY: contentStartY,
        theme: "plain",
        styles: {
            font: "helvetica",
            fontSize: 8,
            textColor: PDF_DARK,
            cellPadding: { top: 3.5, right: 2, bottom: 3.5, left: 2 },
            lineColor: [75, 75, 75],
            lineWidth: { bottom: 0.2 },
        },
        headStyles: {
            fontStyle: "bold",
            fontSize: 8,
            lineWidth: { bottom: 0.35 },
        },
        margin: { left: 14, right: 14, bottom: 18 },
    });

    addBrandedPdfFooters(doc, options.branding);
    doc.save(`${options.fileName}-${Date.now()}.pdf`);
}

type PretForExport = {
    id: string;
    agriculteur: {
        code: string;
        nom: string;
        prenom: string;
    };
    typeCaisse: {
        nom: string;
        poidsKg: number;
    };
    nombrePrete: number;
    nombreRetourne: number;
    nombreRestant: number;
    statut: string;
    datePreT: Date;
    dateRetour?: Date | null;
    observations?: string | null;
};

export async function exportPretsToPDF(
    prets: PretForExport[],
    branding?: PdfBranding,
    title: string = "Prêts de Caisses"
) {
    const tableData = prets.map((pret) => [
        `${pret.agriculteur.nom} ${pret.agriculteur.prenom}`,
        pret.agriculteur.code,
        pret.typeCaisse.nom,
        pret.nombrePrete.toString(),
        pret.nombreRetourne.toString(),
        pret.nombreRestant.toString(),
        translateStatus(pret.statut),
        new Date(pret.datePreT).toLocaleDateString("fr-FR"),
        pret.observations || "-",
    ]);

    await exportTablePdf({
        title,
        fileName: "prets-caisses",
        branding,
        head: ["Agriculteur", "Code", "Type Caisse", "Prêté", "Retourné", "Restant", "Statut", "Date Prêt", "Observations"],
        body: tableData,
    });
}

export function exportPretsToExcel(prets: PretForExport[], fileName: string = "prets-caisses") {
    // Préparer les données pour Excel
    const excelData = prets.map((pret) => ({
        Agriculteur: `${pret.agriculteur.nom} ${pret.agriculteur.prenom}`,
        Code: pret.agriculteur.code,
        "Type de Caisse": pret.typeCaisse.nom,
        "Poids (kg)": pret.typeCaisse.poidsKg,
        "Nombre Prêté": pret.nombrePrete,
        "Nombre Retourné": pret.nombreRetourne,
        "Nombre Restant": pret.nombreRestant,
        Statut: translateStatus(pret.statut),
        "Date de Prêt": new Date(pret.datePreT).toLocaleDateString("fr-FR"),
        "Date de Retour": pret.dateRetour
            ? new Date(pret.dateRetour).toLocaleDateString("fr-FR")
            : "-",
        Observations: pret.observations || "-",
    }));

    // Créer une feuille de calcul
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Ajuster la largeur des colonnes
    const columnWidths = [
        { wch: 25 }, // Agriculteur
        { wch: 12 }, // Code
        { wch: 20 }, // Type de Caisse
        { wch: 12 }, // Poids
        { wch: 15 }, // Nombre Prêté
        { wch: 15 }, // Nombre Retourné
        { wch: 15 }, // Nombre Restant
        { wch: 12 }, // Statut
        { wch: 15 }, // Date de Prêt
        { wch: 15 }, // Date de Retour
        { wch: 30 }, // Observations
    ];
    worksheet["!cols"] = columnWidths;

    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prêts de Caisses");

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, `${fileName}-${new Date().getTime()}.xlsx`);
}

function translateStatus(statut: string): string {
    const translations: Record<string, string> = {
        EN_COURS: "En Cours",
        RETOURNE: "Retourné",
        INCOMPLET: "Incomplet",
    };
    return translations[statut] || statut;
}

function translateStatutSolde(statut: string): string {
    const translations: Record<string, string> = {
        EN_ATTENTE: "En attente",
        PARTIEL: "Partiel",
        PAYE: "Payé",
    };
    return translations[statut] || statut;
}

type PaiementAgriculteurForExport = {
    numero: string;
    Livraison: { Agriculteur: { code: string; nom: string; prenom: string } };
    montant: number;
    montantPaye: number;
    montantRestant: number;
    statut: string;
    createdAt: Date;
};

export function exportPaiementsAgriculteursToPDF(
    bonsAchat: PaiementAgriculteurForExport[],
    branding?: PdfBranding,
    title: string = "Paiements Agriculteurs"
) {
    const tableData = bonsAchat.map((ba) => [
        ba.numero,
        `${ba.Livraison.Agriculteur.nom} ${ba.Livraison.Agriculteur.prenom}`,
        ba.montant.toFixed(2),
        ba.montantPaye.toFixed(2),
        ba.montantRestant.toFixed(2),
        translateStatutSolde(ba.statut),
        new Date(ba.createdAt).toLocaleDateString("fr-FR"),
    ]);

    return exportTablePdf({
        title,
        fileName: "paiements-agriculteurs",
        branding,
        head: ["N° Bon", "Agriculteur", "Montant", "Payé", "Restant", "Statut", "Date"],
        body: tableData,
    });
}

export function exportPaiementsAgriculteursToExcel(
    bonsAchat: PaiementAgriculteurForExport[],
    fileName: string = "paiements-agriculteurs"
) {
    const excelData = bonsAchat.map((ba) => ({
        "N° Bon": ba.numero,
        Agriculteur: `${ba.Livraison.Agriculteur.nom} ${ba.Livraison.Agriculteur.prenom}`,
        Code: ba.Livraison.Agriculteur.code,
        Montant: ba.montant,
        Payé: ba.montantPaye,
        Restant: ba.montantRestant,
        Statut: translateStatutSolde(ba.statut),
        Date: new Date(ba.createdAt).toLocaleDateString("fr-FR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements Agriculteurs");
    XLSX.writeFile(workbook, `${fileName}-${new Date().getTime()}.xlsx`);
}

type VenteForExport = {
    Client: { nom: string };
    StockDate: { TypeDate: { nom: string }; Livraison: { numeroLot: string } };
    quantite: number;
    prixUnitaire: number;
    montant: number;
    montantEncaisse: number;
    montantRestant: number;
    statut: string;
    createdAt: Date;
};

export function exportVentesToPDF(
    ventes: VenteForExport[],
    branding?: PdfBranding,
    title: string = "Ventes"
) {
    const tableData = ventes.map((v) => [
        v.Client.nom,
        `${v.StockDate.TypeDate.nom} (Lot ${v.StockDate.Livraison.numeroLot})`,
        `${v.quantite.toFixed(2)} kg`,
        v.prixUnitaire.toFixed(3),
        v.montant.toFixed(2),
        v.montantRestant.toFixed(2),
        translateStatutSolde(v.statut),
        new Date(v.createdAt).toLocaleDateString("fr-FR"),
    ]);

    return exportTablePdf({
        title,
        fileName: "ventes",
        branding,
        head: ["Client", "Lot", "Quantité", "Prix U.", "Montant", "Restant", "Statut", "Date"],
        body: tableData,
    });
}

export function exportVentesToExcel(ventes: VenteForExport[], fileName: string = "ventes") {
    const excelData = ventes.map((v) => ({
        Client: v.Client.nom,
        "Type de datte": v.StockDate.TypeDate.nom,
        Lot: v.StockDate.Livraison.numeroLot,
        "Quantité (kg)": v.quantite,
        "Prix unitaire": v.prixUnitaire,
        Montant: v.montant,
        Encaissé: v.montantEncaisse,
        Restant: v.montantRestant,
        Statut: translateStatutSolde(v.statut),
        Date: new Date(v.createdAt).toLocaleDateString("fr-FR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");
    XLSX.writeFile(workbook, `${fileName}-${new Date().getTime()}.xlsx`);
}

type DepenseForExport = {
    libelle: string;
    categorie: string | null;
    montant: number;
    dateDepense: Date;
    observations: string | null;
};

export function exportDepensesToPDF(
    depenses: DepenseForExport[],
    branding?: PdfBranding,
    title: string = "Autres Dépenses"
) {
    const tableData = depenses.map((d) => [
        d.libelle,
        d.categorie || "-",
        d.montant.toFixed(2),
        new Date(d.dateDepense).toLocaleDateString("fr-FR"),
        d.observations || "-",
    ]);

    return exportTablePdf({
        title,
        fileName: "depenses",
        branding,
        orientation: "portrait",
        head: ["Libellé", "Catégorie", "Montant", "Date", "Observations"],
        body: tableData,
    });
}

export function exportDepensesToExcel(depenses: DepenseForExport[], fileName: string = "depenses") {
    const excelData = depenses.map((d) => ({
        Libellé: d.libelle,
        Catégorie: d.categorie || "-",
        Montant: d.montant,
        Date: new Date(d.dateDepense).toLocaleDateString("fr-FR"),
        Observations: d.observations || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dépenses");
    XLSX.writeFile(workbook, `${fileName}-${new Date().getTime()}.xlsx`);
}
