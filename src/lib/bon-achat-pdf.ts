import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type BonAchatForInvoice = {
    numero: string;
    montant: number;
    montantRestant?: number;
    observations: string | null;
    createdAt: Date;
    Livraison: {
        numeroLot: string;
        dateLivraison: Date;
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

export type TenantForInvoice = {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
};

const PRIMARY: [number, number, number] = [193, 122, 43]; // #C17A2B
const TEXT: [number, number, number] = [61, 28, 0]; // #3D1C00
const MUTED: [number, number, number] = [110, 100, 90];
const LIGHT: [number, number, number] = [250, 240, 220]; // #FAF0DC

function buildBonAchatInvoiceDoc(bonAchat: BonAchatForInvoice, tenant: TenantForInvoice): jsPDF {
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

    // Titre + numéro à droite
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text("BON D'ACHAT", pageWidth - 14, 20, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.text(`N° ${bonAchat.numero}`, pageWidth - 14, 27, { align: "right" });
    doc.text(
        `Date : ${new Date(bonAchat.createdAt).toLocaleDateString("fr-FR")}`,
        pageWidth - 14,
        32,
        { align: "right" }
    );

    // Séparateur
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    // Bloc Agriculteur / Livraison
    const { Agriculteur, numeroLot, dateLivraison } = bonAchat.Livraison;
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("AGRICULTEUR", 14, 48);
    doc.text("LIVRAISON", pageWidth / 2 + 6, 48);

    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.text(`${Agriculteur.nom} ${Agriculteur.prenom}`, 14, 55);
    doc.text(`Lot ${numeroLot}`, pageWidth / 2 + 6, 55);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`Code : ${Agriculteur.code}`, 14, 60.5);
    doc.text(
        `Date de livraison : ${new Date(dateLivraison).toLocaleDateString("fr-FR")}`,
        pageWidth / 2 + 6,
        60.5
    );

    // Tableau des lignes
    const rows = bonAchat.Livraison.Pesee.map((ligne) => [
        ligne.typeDate?.nom ?? "-",
        ligne.typeCaisse?.nom ?? "-",
        `${ligne.quantiteAcceptee.toFixed(2)} kg`,
        ligne.prixKg.toFixed(3),
        (ligne.quantiteAcceptee * ligne.prixKg).toFixed(2),
    ]);

    autoTable(doc, {
        head: [["Type de datte", "Type de caisse", "Qté acceptée", "Prix/kg", "Montant"]],
        body: rows,
        startY: 68,
        styles: { fontSize: 9, cellPadding: 3, textColor: TEXT },
        headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
            2: { halign: "right" },
            3: { halign: "right" },
            4: { halign: "right" },
        },
        margin: { left: 14, right: 14 },
    });

    // Total
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    doc.text("Montant total", pageWidth - 70, finalY);
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY);
    doc.text(`${bonAchat.montant.toFixed(2)} TND`, pageWidth - 14, finalY, { align: "right" });

    let y = finalY + 8;

    // Reste à payer (uniquement si un solde est fourni et qu'il reste un montant dû)
    if (bonAchat.montantRestant !== undefined && bonAchat.montantRestant > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...MUTED);
        doc.text("Reste à payer", pageWidth - 70, y);
        doc.setTextColor(220, 38, 38);
        doc.text(`${bonAchat.montantRestant.toFixed(2)} TND`, pageWidth - 14, y, { align: "right" });
        y += 8;
    }

    y += 4;

    // Observations
    if (bonAchat.observations) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...MUTED);
        doc.text("Observations", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXT);
        const wrapped = doc.splitTextToSize(bonAchat.observations, pageWidth - 28);
        doc.text(wrapped, 14, y + 5);
        y += 5 + wrapped.length * 4.5;
    }

    // Signatures
    const signatureY = Math.max(y + 20, doc.internal.pageSize.getHeight() - 35);
    doc.setDrawColor(...MUTED);
    doc.setLineWidth(0.2);
    doc.line(14, signatureY, 74, signatureY);
    doc.line(pageWidth - 74, signatureY, pageWidth - 14, signatureY);

    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Signature Wakala", 14, signatureY + 5);
    doc.text("Signature Agriculteur", pageWidth - 74, signatureY + 5);

    return doc;
}

export function downloadBonAchatPDF(bonAchat: BonAchatForInvoice, tenant: TenantForInvoice) {
    const doc = buildBonAchatInvoiceDoc(bonAchat, tenant);
    doc.save(`bon-achat-${bonAchat.numero}.pdf`);
}

export function printBonAchatPDF(bonAchat: BonAchatForInvoice, tenant: TenantForInvoice) {
    const doc = buildBonAchatInvoiceDoc(bonAchat, tenant);
    const blobUrl = doc.output("bloburl");
    const win = window.open(blobUrl as unknown as string, "_blank");
    win?.addEventListener("load", () => {
        win.focus();
        win.print();
    });
}
