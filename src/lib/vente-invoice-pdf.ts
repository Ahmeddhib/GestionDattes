import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    addBrandedPdfFooters,
    loadPdfLogo,
    normalizePdfBranding,
    type PdfBranding,
} from "@/lib/pdf-branding";

export type VenteForInvoice = {
    id: string;
    quantite: number;
    prixUnitaire: number;
    montant: number;
    createdAt: Date | string;
    Client: {
        nom: string;
        telephone: string | null;
        adresse?: string | null;
        email?: string | null;
    };
    StockDate: {
        TypeDate: { nom: string };
        Livraison: { numeroLot: string };
    };
};

const TIMBRE_FISCAL = 1;
const GREEN: [number, number, number] = [0, 78, 62];
const DARK: [number, number, number] = [39, 43, 48];
const MUTED: [number, number, number] = [90, 96, 102];

function invoiceNumber(vente: VenteForInvoice) {
    const year = new Date(vente.createdAt).getFullYear();
    const suffix = vente.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `KFP/${year}/${suffix || "VENTE"}`;
}

async function buildVenteInvoiceDoc(vente: VenteForInvoice, branding?: PdfBranding) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const company = normalizePdfBranding(branding);
    const logo = await loadPdfLogo(company.logoUrl);

    if (logo) {
        doc.addImage(logo, "JPEG", 14, 10, 48, 48, undefined, "FAST");
    } else {
        doc.setTextColor(...GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text(company.name, 14, 27);
        doc.setFontSize(8);
        doc.text("FRUITS PACKAGING", 14, 33);
    }

    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("FACTURE", pageWidth - 14, 25, { align: "right" });
    doc.setFontSize(11);
    doc.text(`FACTURE N° : ${invoiceNumber(vente)}`, pageWidth - 14, 35, { align: "right" });
    doc.setFontSize(9);
    doc.text(
        `DATE : ${new Date(vente.createdAt).toLocaleDateString("fr-FR")}`,
        pageWidth - 14,
        42,
        { align: "right" }
    );

    const blockTop = 70;
    doc.setFontSize(10);
    doc.text("ÉMETTEUR :", 18, blockTop);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    [company.name, company.email, company.address, company.phone ? `Tél : ${company.phone}` : null]
        .filter((line): line is string => Boolean(line))
        .forEach((line, index) => doc.text(line, 18, blockTop + 7 + index * 5.5));

    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DESTINATAIRE :", pageWidth - 18, blockTop, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    const recipient = [
        vente.Client.nom,
        vente.Client.adresse,
        vente.Client.email,
        vente.Client.telephone ? `Tél : ${vente.Client.telephone}` : null,
    ].filter((line): line is string => Boolean(line));
    recipient.forEach((line, index) => {
        const wrapped = doc.splitTextToSize(line, 70);
        doc.text(wrapped, pageWidth - 18, blockTop + 7 + index * 6, { align: "right" });
    });

    autoTable(doc, {
        startY: 118,
        margin: { left: 14, right: 14 },
        head: [["DESCRIPTION", "QUANTITÉ", "PRIX UNITAIRE HT", "TOTAL HT"]],
        body: [[
            `${vente.StockDate.TypeDate.nom} — Lot ${vente.StockDate.Livraison.numeroLot}`,
            `${vente.quantite.toFixed(2)} kg`,
            `${vente.prixUnitaire.toFixed(3)} TND`,
            `${vente.montant.toFixed(3)} TND`,
        ]],
        theme: "plain",
        styles: {
            font: "helvetica",
            fontSize: 10,
            textColor: DARK,
            cellPadding: { top: 5, right: 2, bottom: 5, left: 2 },
            lineColor: [75, 75, 75],
            lineWidth: { bottom: 0.25 },
        },
        headStyles: {
            fontStyle: "bold",
            fontSize: 9,
            lineWidth: { bottom: 0.35 },
        },
        columnStyles: {
            0: { cellWidth: 78 },
            1: { halign: "center", cellWidth: 32 },
            2: { halign: "right", cellWidth: 38 },
            3: { halign: "right" },
        },
    });

    const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;
    const totalsTop = Math.max(tableEnd + 50, 205);
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.3);
    doc.line(14, totalsTop - 8, pageWidth - 14, totalsTop - 8);

    const totalTtc = vente.montant + TIMBRE_FISCAL;
    const totals = [
        ["TOTAL HT :", vente.montant.toFixed(3)],
        ["TVA :", "0.000"],
        ["Timbre :", TIMBRE_FISCAL.toFixed(3)],
        ["TOTAL TTC :", totalTtc.toFixed(3)],
    ];

    totals.forEach(([label, value], index) => {
        const y = totalsTop + index * 8;
        doc.setTextColor(...DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(index === totals.length - 1 ? 12 : 10);
        doc.text(label, pageWidth - 58, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(`${value} TND`, pageWidth - 14, y, { align: "right" });
    });

    doc.setTextColor(...GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(company.name.toUpperCase(), 18, totalsTop + 18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Merci pour votre confiance.", 18, totalsTop + 25);

    addBrandedPdfFooters(doc, company);
    return doc;
}

export async function downloadVenteInvoicePDF(vente: VenteForInvoice, branding?: PdfBranding) {
    const doc = await buildVenteInvoiceDoc(vente, branding);
    doc.save(`facture-${invoiceNumber(vente).replaceAll("/", "-")}.pdf`);
}
