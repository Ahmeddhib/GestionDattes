import autoTable from "jspdf-autotable";
import {
    addBrandedPdfFooters,
    createBrandedPdf,
    PDF_DARK,
    printBrandedPdf,
    type PdfBranding,
} from "@/lib/pdf-branding";

export type BilanForPdf = {
    periodeLabel: string;
    totalEncaissementsClients: number;
    totalPaiementsAgriculteurs: number;
    totalDepensesAutres: number;
    tresorerieNette: number;
    chiffreAffaires: number;
    creancesClients: number;
    creancesClientsDetail: { client: string; restant: number }[];
    dettesAgriculteurs: number;
    dettesAgriculteursDetail: { agriculteur: string; restant: number }[];
    resultatNet: number;
};

export type TenantForBilanPdf = PdfBranding;

async function buildBilanDoc(bilan: BilanForPdf, tenant: TenantForBilanPdf) {
    const { doc, contentStartY } = await createBrandedPdf({
        title: "Bilan financier",
        branding: tenant,
        reference: `PÉRIODE : ${bilan.periodeLabel}`,
    });

    autoTable(doc, {
        head: [["INDICATEUR", "MONTANT"]],
        body: [
            ["Total encaissements clients", `${bilan.totalEncaissementsClients.toFixed(3)} TND`],
            ["Total paiements agriculteurs", `${bilan.totalPaiementsAgriculteurs.toFixed(3)} TND`],
            ["Total autres dépenses", `${bilan.totalDepensesAutres.toFixed(3)} TND`],
            ["Trésorerie nette", `${bilan.tresorerieNette.toFixed(3)} TND`],
            ["Chiffre d'affaires", `${bilan.chiffreAffaires.toFixed(3)} TND`],
            ["Créances clients", `${bilan.creancesClients.toFixed(3)} TND`],
            ["Dettes agriculteurs", `${bilan.dettesAgriculteurs.toFixed(3)} TND`],
            ["RÉSULTAT NET", `${bilan.resultatNet.toFixed(3)} TND`],
        ],
        startY: contentStartY,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 3.5, textColor: PDF_DARK, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
        headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
        columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
        margin: { left: 14, right: 14, bottom: 18 },
    });

    let y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    if (bilan.creancesClientsDetail.length > 0) {
        autoTable(doc, {
            head: [["CRÉANCES CLIENTS", "RESTE À PAYER"]],
            body: bilan.creancesClientsDetail.map((item) => [item.client, `${item.restant.toFixed(3)} TND`]),
            startY: y,
            theme: "plain",
            styles: { fontSize: 8.5, cellPadding: 3, textColor: PDF_DARK, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
            headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
            columnStyles: { 1: { halign: "right" } },
            margin: { left: 14, right: 14, bottom: 18 },
        });
        y = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }

    if (bilan.dettesAgriculteursDetail.length > 0) {
        autoTable(doc, {
            head: [["DETTES AGRICULTEURS", "RESTE À PAYER"]],
            body: bilan.dettesAgriculteursDetail.map((item) => [item.agriculteur, `${item.restant.toFixed(3)} TND`]),
            startY: y,
            theme: "plain",
            styles: { fontSize: 8.5, cellPadding: 3, textColor: PDF_DARK, lineColor: [75, 75, 75], lineWidth: { bottom: 0.2 } },
            headStyles: { fontStyle: "bold", lineWidth: { bottom: 0.35 } },
            columnStyles: { 1: { halign: "right" } },
            margin: { left: 14, right: 14, bottom: 18 },
        });
    }

    addBrandedPdfFooters(doc, tenant);
    return doc;
}

export async function downloadBilanPDF(bilan: BilanForPdf, tenant: TenantForBilanPdf) {
    const doc = await buildBilanDoc(bilan, tenant);
    doc.save(`bilan-financier-${Date.now()}.pdf`);
}

export function printBilanPDF(bilan: BilanForPdf, tenant: TenantForBilanPdf) {
    return printBrandedPdf(() => buildBilanDoc(bilan, tenant));
}
