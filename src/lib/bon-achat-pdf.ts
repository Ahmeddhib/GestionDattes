import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    addBrandedPdfFooters,
    loadPdfLogo,
    normalizePdfBranding,
    printBrandedPdf,
    type PdfBranding,
} from "@/lib/pdf-branding";

export type BonAchatForInvoice = {
    numero: string;
    montant: number;
    montantPaye?: number;
    montantRestant?: number;
    observations: string | null;
    createdAt: Date | string;
    Livraison: {
        numeroLot: string;
        dateLivraison: Date | string;
        Agriculteur: {
            code: string;
            nom: string;
            prenom: string;
        };
        Pesee: {
            id: string;
            prixKg: number;
            quantiteAcceptee: number;
            typeDate: { nom: string } | null;
            typeCaisse: { nom: string } | null;
        }[];
    };
};

export type TenantForInvoice = PdfBranding;

const GREEN: [number, number, number] = [0, 78, 62];
const DARK: [number, number, number] = [39, 43, 48];
const MUTED: [number, number, number] = [90, 96, 102];

async function buildBonAchatInvoiceDoc(
    bonAchat: BonAchatForInvoice,
    tenant: TenantForInvoice
): Promise<jsPDF> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const company = normalizePdfBranding(tenant);
    const logo = await loadPdfLogo(company.logoUrl);

    if (logo) {
        doc.addImage(logo, "JPEG", 14, 10, 48, 48, undefined, "FAST");
    } else {
        doc.setTextColor(...GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("KAYEN", 14, 27);
        doc.setFontSize(8);
        doc.text("FRUITS PACKAGING", 14, 33);
    }

    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("BON D'ACHAT", pageWidth - 14, 25, { align: "right" });
    doc.setFontSize(11);
    doc.text(`BON N° : ${bonAchat.numero}`, pageWidth - 14, 35, { align: "right" });
    doc.setFontSize(9);
    doc.text(
        `DATE : ${new Date(bonAchat.createdAt).toLocaleDateString("fr-FR")}`,
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
    const issuer = [
        company.name,
        company.email,
        company.address,
        company.phone ? `Tél : ${company.phone}` : null,
    ].filter((line): line is string => Boolean(line));
    issuer.forEach((line, index) => doc.text(line, 18, blockTop + 7 + index * 5.5));

    const { Agriculteur, numeroLot, dateLivraison } = bonAchat.Livraison;
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("AGRICULTEUR :", pageWidth - 18, blockTop, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.setFontSize(9);
    [
        `${Agriculteur.nom} ${Agriculteur.prenom}`,
        `Code : ${Agriculteur.code}`,
        `Livraison : lot ${numeroLot}`,
        `Date : ${new Date(dateLivraison).toLocaleDateString("fr-FR")}`,
    ].forEach((line, index) => {
        doc.text(line, pageWidth - 18, blockTop + 7 + index * 5.5, { align: "right" });
    });

    const rows = bonAchat.Livraison.Pesee.map((ligne) => [
        [ligne.typeDate?.nom ?? "Type non renseigné", ligne.typeCaisse?.nom, `Lot ${numeroLot}`]
            .filter(Boolean)
            .join(" — "),
        `${ligne.quantiteAcceptee.toFixed(2)} kg`,
        `${ligne.prixKg.toFixed(3)} TND`,
        `${(ligne.quantiteAcceptee * ligne.prixKg).toFixed(3)} TND`,
    ]);

    autoTable(doc, {
        startY: 118,
        margin: { left: 14, right: 14 },
        head: [["DESCRIPTION", "QUANTITÉ", "PRIX UNITAIRE", "TOTAL"]],
        body: rows,
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
    let totalsTop = Math.max(tableEnd + 40, 195);
    if (totalsTop > pageHeight - 55) {
        doc.addPage();
        totalsTop = 35;
    }

    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.3);
    doc.line(14, totalsTop - 8, pageWidth - 14, totalsTop - 8);

    const amountPaid = bonAchat.montantPaye ?? Math.max(0, bonAchat.montant - (bonAchat.montantRestant ?? bonAchat.montant));
    const amountRemaining = bonAchat.montantRestant ?? Math.max(0, bonAchat.montant - amountPaid);
    const totals: Array<[string, number, boolean]> = [
        ["TOTAL ACHAT :", bonAchat.montant, true],
        ["MONTANT PAYÉ :", amountPaid, false],
        ["RESTE À PAYER :", amountRemaining, true],
    ];

    totals.forEach(([label, value, emphasized], index) => {
        const y = totalsTop + index * 8;
        doc.setTextColor(...DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(emphasized ? 11 : 10);
        doc.text(label, pageWidth - 58, y, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.text(`${value.toFixed(3)} TND`, pageWidth - 14, y, { align: "right" });
    });

    let footerTop = totalsTop + totals.length * 8 + 5;
    if (bonAchat.observations) {
        doc.setTextColor(...DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("OBSERVATIONS :", 18, footerTop);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...MUTED);
        const wrapped = doc.splitTextToSize(bonAchat.observations, pageWidth - 36);
        doc.text(wrapped, 18, footerTop + 6);
        footerTop += 8 + wrapped.length * 4.5;
    }

    const signatureY = Math.min(Math.max(footerTop + 22, 260), pageHeight - 20);
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.2);
    doc.line(18, signatureY, 76, signatureY);
    doc.line(pageWidth - 76, signatureY, pageWidth - 18, signatureY);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Signature et cachet de la société", 18, signatureY + 5);
    doc.text("Signature de l'agriculteur", pageWidth - 76, signatureY + 5);

    addBrandedPdfFooters(doc, company);
    return doc;
}

export async function downloadBonAchatPDF(
    bonAchat: BonAchatForInvoice,
    tenant: TenantForInvoice
) {
    const doc = await buildBonAchatInvoiceDoc(bonAchat, tenant);
    doc.save(`bon-achat-${bonAchat.numero}.pdf`);
}

export async function printBonAchatPDF(
    bonAchat: BonAchatForInvoice,
    tenant: TenantForInvoice
) {
    return printBrandedPdf(() => buildBonAchatInvoiceDoc(bonAchat, tenant));
}
