import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    addBrandedPdfFooters,
    createBrandedPdf,
    PDF_DARK,
    printBrandedPdf,
    type PdfBranding,
} from "@/lib/pdf-branding";

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
    stockEntreParTypeDate: { typeDateId: string; nom: string; quantiteDisponible: number }[];
    stockOrigineRestantParTypeDate: { typeDateId: string; nom: string; quantiteDisponible: number }[];
    type: "PROVISOIRE" | "FINAL";
    version: number;
    genereAt: Date;
}

export interface SaisonForPdf {
    nom: string;
    dateDebut: Date | string;
    dateFin: Date | string;
}

/**
 * `jspdf-autotable` accroche la position finale du tableau sur l'instance jsPDF
 * sans la déclarer dans ses types. Un seul point d'accès typé plutôt qu'un
 * `as any` à chaque appel.
 */
function finDuTableau(doc: jsPDF): number {
    return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

const TEXT = PDF_DARK;

/**
 * Construit le PDF du bilan de saison en ne lisant QUE les champs déjà
 * figés dans BilanSaison — aucune donnée n'est recalculée ici.
 */
async function buildBilanSaisonDoc(
    bilan: BilanSaisonForPdf,
    saison: SaisonForPdf,
    branding?: PdfBranding
): Promise<jsPDF> {
    const estProvisoire = bilan.type === "PROVISOIRE";
    const { doc, contentStartY } = await createBrandedPdf({
        title: estProvisoire ? "Bilan provisoire" : "Bilan final de saison",
        branding,
        reference: `SAISON : ${saison.nom}`,
        date: bilan.genereAt,
        subtitle: `${new Date(saison.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(saison.dateFin).toLocaleDateString("fr-FR")} · ${estProvisoire ? `Version ${bilan.version} — document provisoire` : "Bilan de clôture"}`,
    });

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
        startY: contentStartY,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
        headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
        columnStyles: { 1: { halign: "right" } },
    });

    let y = finDuTableau(doc) + 10;

    if (bilan.stockFinalParTypeDate.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Stock final par variété", 14, y);

        autoTable(doc, {
            head: [["Variété", "Quantité disponible"]],
            body: bilan.stockFinalParTypeDate.map((s) => [s.nom, s.quantiteDisponible.toFixed(2)]),
            startY: y + 4,
            theme: "plain",
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
            headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
            columnStyles: { 1: { halign: "right" } },
        });

        y = finDuTableau(doc) + 10;
    }

    // Chiffres attribuables à la saison, à distinguer du stock physique global
    // ci-dessus : ici c'est ce qui est ENTRÉ durant la campagne, et ce qu'il en
    // restait au moment du calcul.
    if (bilan.stockEntreParTypeDate.length > 0) {
        const restantParType = new Map(
            bilan.stockOrigineRestantParTypeDate.map((s) => [s.typeDateId, s.quantiteDisponible])
        );

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Stock issu de cette saison", 14, y);

        autoTable(doc, {
            head: [["Variété", "Entré durant la saison", "Restant au calcul"]],
            body: bilan.stockEntreParTypeDate.map((s) => [
                s.nom,
                s.quantiteDisponible.toFixed(2),
                (restantParType.get(s.typeDateId) ?? 0).toFixed(2),
            ]),
            startY: y + 4,
            theme: "plain",
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
            headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        });

        y = finDuTableau(doc) + 10;
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
            theme: "plain",
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
            headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
        });
    }

    addBrandedPdfFooters(doc, branding);
    return doc;
}

export async function downloadBilanSaisonPDF(
    bilan: BilanSaisonForPdf,
    saison: SaisonForPdf,
    branding?: PdfBranding
) {
    const doc = await buildBilanSaisonDoc(bilan, saison, branding);
    const suffixe = bilan.type === "PROVISOIRE" ? `provisoire-v${bilan.version}` : "final";
    doc.save(`bilan-saison-${saison.nom.replace(/\s+/g, "-")}-${suffixe}.pdf`);
}

export function printBilanSaisonPDF(
    bilan: BilanSaisonForPdf,
    saison: SaisonForPdf,
    branding?: PdfBranding
) {
    return printBrandedPdf(() => buildBilanSaisonDoc(bilan, saison, branding));
}
