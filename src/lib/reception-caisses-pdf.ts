import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addBrandedPdfFooters, loadPdfLogo, normalizePdfBranding, type PdfBranding } from "@/lib/pdf-branding";

export type ReceptionCaissesForPdf = {
    numero: string;
    date: Date | string;
    matriculeCamion?: string | null;
    chauffeur?: string | null;
    observations?: string | null;
    Client: { nom: string };
    Lignes: Array<{ quantite: number; TypeCaisse: { nom: string } }>;
};

export async function downloadReceptionCaissesPDF(reception: ReceptionCaissesForPdf, branding?: PdfBranding) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const company = normalizePdfBranding(branding);
    const logo = await loadPdfLogo(company.logoUrl);
    const width = doc.internal.pageSize.getWidth();
    const green: [number, number, number] = [0, 78, 62];

    if (logo) doc.addImage(logo, "JPEG", 14, 10, 40, 40, undefined, "FAST");
    else {
        doc.setTextColor(...green);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(company.name, 14, 25);
    }
    doc.setTextColor(39, 43, 48);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("BON DE RÉCEPTION DE CAISSES", width - 14, 24, { align: "right" });
    doc.setFontSize(11);
    doc.text(`N° ${reception.numero}`, width - 14, 34, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date(reception.date).toLocaleDateString("fr-FR"), width - 14, 41, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("WAKALA", 14, 62);
    doc.text("CLIENT", width - 14, 62, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 96, 102);
    doc.text(company.name, 14, 69);
    doc.text(reception.Client.nom, width - 14, 69, { align: "right" });

    doc.setTextColor(39, 43, 48);
    const transport = [
        ["Matricule camion", reception.matriculeCamion || "—"],
        ["Chauffeur", reception.chauffeur || "—"],
    ];
    autoTable(doc, {
        startY: 82,
        body: transport,
        theme: "plain",
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    });
    const transportEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 96;
    autoTable(doc, {
        startY: transportEnd + 8,
        head: [["TYPE DE CAISSE", "QUANTITÉ"]],
        body: reception.Lignes.map((ligne) => [ligne.TypeCaisse.nom, ligne.quantite.toString()]),
        foot: [["TOTAL", reception.Lignes.reduce((total, ligne) => total + ligne.quantite, 0).toString()]],
        theme: "grid",
        margin: { left: 14, right: 14 },
        styles: { fontSize: 10, lineColor: [220, 210, 195] },
        headStyles: { fillColor: green, textColor: [255, 255, 255] },
        footStyles: { fillColor: [242, 235, 224], textColor: [39, 43, 48], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right", cellWidth: 45 } },
    });
    const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;
    if (reception.observations) {
        doc.setFont("helvetica", "bold");
        doc.text("Observations", 14, tableEnd + 12);
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(reception.observations, width - 28), 14, tableEnd + 19);
    }
    const signatureY = Math.max(tableEnd + 48, 225);
    doc.setFont("helvetica", "bold");
    doc.text("Signature Wakala", 30, signatureY);
    doc.text("Signature Client / Chauffeur", width - 30, signatureY, { align: "right" });
    addBrandedPdfFooters(doc, company);
    doc.save(`reception-caisses-${reception.numero}.pdf`);
}
