import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface BilanSaisonForPdf {
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
    stockFinalParTypeDate: { typeDateId: string; nom: string; quantiteDisponible: number }[];
    stockCaisses: {
        typeCaisseId: string;
        nom: string;
        nombrePrete: number;
        nombreRetourne: number;
        nombreNonRetourne: number;
    }[];
    clotureeAt: Date;
}

export interface SaisonForPdf {
    nom: string;
    dateDebut: Date | string;
    dateFin: Date | string;
}

const PRIMARY: [number, number, number] = [193, 122, 43];
const TEXT: [number, number, number] = [61, 28, 0];
const MUTED: [number, number, number] = [110, 100, 90];

/**
 * Construit le PDF du bilan de saison en ne lisant QUE les champs déjà
 * figés dans BilanSaison — aucune donnée n'est recalculée ici.
 */
function buildBilanSaisonDoc(bilan: BilanSaisonForPdf, saison: SaisonForPdf): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.text("BILAN DE SAISON", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY);
    doc.text(saison.nom, 14, 28);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(
        `${new Date(saison.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(saison.dateFin).toLocaleDateString("fr-FR")}`,
        14,
        34
    );
    doc.text(`Clôturée le : ${bilan.clotureeAt.toLocaleDateString("fr-FR")}`, pageWidth - 14, 20, {
        align: "right",
    });

    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    const rows: { label: string; value: string }[] = [
        { label: "Nombre de livraisons", value: `${bilan.nombreLivraisons}` },
        { label: "Quantité livrée (kg)", value: bilan.totalQuantiteLivree.toFixed(2) },
        { label: "Quantité acceptée (kg)", value: bilan.totalQuantiteAcceptee.toFixed(2) },
        { label: "Total achats (TND)", value: bilan.totalAchatsMontant.toFixed(2) },
        { label: "Total paiements agriculteurs (TND)", value: bilan.totalPaiementsAgriculteurs.toFixed(2) },
        { label: "Solde agriculteurs restant (TND)", value: bilan.soldeAgriculteursRestant.toFixed(2) },
        { label: "Quantité vendue (kg)", value: bilan.totalVentesQuantite.toFixed(2) },
        { label: "Chiffre d'affaires (TND)", value: bilan.chiffreAffairesVentes.toFixed(2) },
        { label: "Total encaissements (TND)", value: bilan.totalEncaissements.toFixed(2) },
        { label: "Créances clients restantes (TND)", value: bilan.creancesClientsRestantes.toFixed(2) },
        { label: "Total dépenses autres (TND)", value: bilan.totalDepensesAutres.toFixed(2) },
        { label: "Trésorerie (TND)", value: bilan.tresorerie.toFixed(2) },
        { label: "Marge brute (TND)", value: bilan.margeBrute.toFixed(2) },
        { label: "Marge nette (TND)", value: bilan.margeNette.toFixed(2) },
    ];

    autoTable(doc, {
        head: [["Indicateur", "Valeur"]],
        body: rows.map((r) => [r.label, r.value]),
        startY: 46,
        styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
    });

    let y = (doc as any).lastAutoTable.finalY + 10;

    if (bilan.stockFinalParTypeDate.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Stock final par variété", 14, y);

        autoTable(doc, {
            head: [["Variété", "Quantité disponible"]],
            body: bilan.stockFinalParTypeDate.map((s) => [s.nom, s.quantiteDisponible.toFixed(2)]),
            startY: y + 4,
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
            headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
            columnStyles: { 1: { halign: "right" } },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (bilan.stockCaisses.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Caisses", 14, y);

        autoTable(doc, {
            head: [["Type de caisse", "Prêtées", "Retournées", "Non retournées"]],
            body: bilan.stockCaisses.map((c) => [
                c.nom,
                `${c.nombrePrete}`,
                `${c.nombreRetourne}`,
                `${c.nombreNonRetourne}`,
            ]),
            startY: y + 4,
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
            headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
        });
    }

    return doc;
}

export function downloadBilanSaisonPDF(bilan: BilanSaisonForPdf, saison: SaisonForPdf) {
    const doc = buildBilanSaisonDoc(bilan, saison);
    doc.save(`bilan-saison-${saison.nom.replace(/\s+/g, "-")}.pdf`);
}

export function printBilanSaisonPDF(bilan: BilanSaisonForPdf, saison: SaisonForPdf) {
    const doc = buildBilanSaisonDoc(bilan, saison);
    const blobUrl = doc.output("bloburl");
    const win = window.open(blobUrl as unknown as string, "_blank");
    win?.addEventListener("load", () => {
        win.focus();
        win.print();
    });
}
