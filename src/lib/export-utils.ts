import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

export function exportPretsToPDF(prets: PretForExport[], title: string = "Prêts de Caisses") {
    const doc = new jsPDF();

    // Configuration des couleurs
    const primaryColor: [number, number, number] = [193, 122, 43]; // #C17A2B
    const textColor: [number, number, number] = [61, 28, 0]; // #3D1C00

    // En-tête du document
    doc.setFontSize(20);
    doc.setTextColor(...textColor);
    doc.text(title, 14, 20);

    // Date du rapport
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 14, 28);

    // Préparer les données pour le tableau
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

    // Générer le tableau
    autoTable(doc, {
        head: [
            [
                "Agriculteur",
                "Code",
                "Type Caisse",
                "Prêté",
                "Retourné",
                "Restant",
                "Statut",
                "Date Prêt",
                "Observations",
            ],
        ],
        body: tableData,
        startY: 35,
        styles: {
            fontSize: 8,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255] as [number, number, number],
            fontStyle: "bold",
        },
        alternateRowStyles: {
            fillColor: [250, 240, 220], // #FAF0DC
        },
        margin: { top: 35 },
    });

    // Télécharger le PDF
    doc.save(`prets-caisses-${new Date().getTime()}.pdf`);
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
