import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export type TenantForBilanPdf = {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};

const PRIMARY: [number, number, number] = [193, 122, 43]; // #C17A2B
const TEXT: [number, number, number] = [61, 28, 0]; // #3D1C00
const MUTED: [number, number, number] = [110, 100, 90];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];

function buildBilanDoc(bilan: BilanForPdf, tenant: TenantForBilanPdf): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // En-tête : identité de la Wakala
    doc.setFontSize(18);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(tenant.name, 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    let infoY = 26;
    for (const line of [tenant.address, tenant.phone, tenant.email].filter(Boolean) as string[]) {
        doc.text(line, 14, infoY);
        infoY += 4.5;
    }

    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text("BILAN FINANCIER", pageWidth - 14, 20, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.text(`Période : ${bilan.periodeLabel}`, pageWidth - 14, 27, { align: "right" });
    doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, pageWidth - 14, 32, { align: "right" });

    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    // Bloc résumé : lignes label/valeur empilées
    const rows: { label: string; value: number; color: [number, number, number]; big?: boolean }[] = [
        { label: "Total encaissements clients", value: bilan.totalEncaissementsClients, color: GREEN },
        { label: "Total paiements agriculteurs", value: -bilan.totalPaiementsAgriculteurs, color: RED },
        { label: "Total autres dépenses", value: -bilan.totalDepensesAutres, color: RED },
        { label: "Trésorerie nette", value: bilan.tresorerieNette, color: PRIMARY, big: true },
        { label: "Chiffre d'affaires", value: bilan.chiffreAffaires, color: TEXT },
        { label: "Créances clients (reste dû)", value: bilan.creancesClients, color: RED },
        { label: "Dettes agriculteurs (reste dû)", value: bilan.dettesAgriculteurs, color: RED },
        { label: "Résultat net", value: bilan.resultatNet, color: PRIMARY, big: true },
    ];

    let y = 52;
    for (const row of rows) {
        doc.setFontSize(row.big ? 12 : 10);
        doc.setFont("helvetica", row.big ? "bold" : "normal");
        doc.setTextColor(...TEXT);
        doc.text(row.label, 14, y);

        doc.setFontSize(row.big ? 13 : 11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...row.color);
        doc.text(`${row.value.toFixed(2)} TND`, pageWidth - 14, y, { align: "right" });

        y += row.big ? 10 : 7.5;
    }

    // Détail : top créances clients / dettes agriculteurs non soldées
    y += 4;
    if (bilan.creancesClientsDetail.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXT);
        doc.text("Top créances clients non soldées", 14, y);

        autoTable(doc, {
            head: [["Client", "Reste à payer"]],
            body: bilan.creancesClientsDetail.map((d) => [d.client, d.restant.toFixed(2)]),
            startY: y + 4,
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
            headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
            columnStyles: { 1: { halign: "right" } },
            margin: { left: 14, right: pageWidth / 2 + 4 },
            tableWidth: pageWidth / 2 - 18,
        });
    }

    if (bilan.dettesAgriculteursDetail.length > 0) {
        const startY = y + 4;
        autoTable(doc, {
            head: [["Agriculteur", "Reste à payer"]],
            body: bilan.dettesAgriculteursDetail.map((d) => [d.agriculteur, d.restant.toFixed(2)]),
            startY,
            styles: { fontSize: 9, cellPadding: 2.5, textColor: TEXT },
            headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
            columnStyles: { 1: { halign: "right" } },
            margin: { left: pageWidth / 2 + 4, right: 14 },
            tableWidth: pageWidth / 2 - 18,
        });
    }

    return doc;
}

export function downloadBilanPDF(bilan: BilanForPdf, tenant: TenantForBilanPdf) {
    const doc = buildBilanDoc(bilan, tenant);
    doc.save(`bilan-financier-${new Date().getTime()}.pdf`);
}

export function printBilanPDF(bilan: BilanForPdf, tenant: TenantForBilanPdf) {
    const doc = buildBilanDoc(bilan, tenant);
    const blobUrl = doc.output("bloburl");
    const win = window.open(blobUrl as unknown as string, "_blank");
    win?.addEventListener("load", () => {
        win.focus();
        win.print();
    });
}
