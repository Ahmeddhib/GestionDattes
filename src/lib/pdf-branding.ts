import jsPDF from "jspdf";

export type PdfBranding = {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
};

export const DEFAULT_PDF_BRANDING: PdfBranding = {
    name: "KAYEN FRUITS PACKAGING",
    address: "Laouina, Douz, Kebili",
    phone: "29 523 527",
    email: "kayen-fruits@proton.me",
    logoUrl: "/kayen-logo.jpg",
};

export const PDF_GREEN: [number, number, number] = [0, 78, 62];
export const PDF_DARK: [number, number, number] = [39, 43, 48];
export const PDF_MUTED: [number, number, number] = [90, 96, 102];

export function normalizePdfBranding(branding?: Partial<PdfBranding> | null): PdfBranding {
    return {
        ...DEFAULT_PDF_BRANDING,
        ...branding,
        name: branding?.name || DEFAULT_PDF_BRANDING.name,
        logoUrl: branding?.logoUrl || DEFAULT_PDF_BRANDING.logoUrl,
    };
}

export async function loadPdfLogo(logoUrl?: string | null): Promise<string | null> {
    try {
        const response = await fetch(logoUrl || DEFAULT_PDF_BRANDING.logoUrl!);
        if (!response.ok) return null;
        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

export async function createBrandedPdf(options: {
    title: string;
    branding?: Partial<PdfBranding> | null;
    reference?: string;
    date?: Date | string;
    subtitle?: string;
    orientation?: "portrait" | "landscape";
}) {
    const branding = normalizePdfBranding(options.branding);
    const doc = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: options.orientation ?? "portrait",
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const logo = await loadPdfLogo(branding.logoUrl);

    if (logo) {
        const format = branding.logoUrl?.toLowerCase().endsWith(".png") ? "PNG" : "JPEG";
        doc.addImage(logo, format, 14, 10, 48, 48, undefined, "FAST");
    } else {
        doc.setTextColor(...PDF_GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(branding.name, 14, 28);
    }

    doc.setTextColor(...PDF_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(options.title.length > 22 ? 22 : 30);
    doc.text(options.title.toUpperCase(), pageWidth - 14, 25, { align: "right" });
    doc.setFontSize(10);
    if (options.reference) {
        doc.text(options.reference, pageWidth - 14, 35, { align: "right" });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
        `DATE : ${new Date(options.date ?? Date.now()).toLocaleDateString("fr-FR")}`,
        pageWidth - 14,
        options.reference ? 42 : 36,
        { align: "right" }
    );
    if (options.subtitle) {
        doc.setTextColor(...PDF_MUTED);
        doc.text(options.subtitle, pageWidth - 14, options.reference ? 49 : 43, { align: "right" });
    }

    doc.setTextColor(...PDF_DARK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("WAKALA :", 18, 70);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_MUTED);
    doc.setFontSize(9);
    [
        branding.name,
        branding.email,
        branding.address,
        branding.phone ? `Tél : ${branding.phone}` : null,
    ]
        .filter((line): line is string => Boolean(line))
        .forEach((line, index) => doc.text(line, 18, 77 + index * 5.5));

    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.3);
    doc.line(14, 102, pageWidth - 14, 102);

    return { doc, branding, contentStartY: 108 };
}

export function addBrandedPdfFooters(doc: jsPDF, branding?: Partial<PdfBranding> | null) {
    const resolved = normalizePdfBranding(branding);
    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
        doc.setPage(page);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setTextColor(...PDF_GREEN);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(resolved.name.toUpperCase(), 14, pageHeight - 8);
        doc.setTextColor(...PDF_MUTED);
        doc.setFont("helvetica", "normal");
        doc.text(`Page ${page}/${pages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
    }
}

export async function printBrandedPdf(build: () => Promise<jsPDF>) {
    const printWindow = window.open("", "_blank");
    const doc = await build();
    const blobUrl = doc.output("bloburl") as unknown as string;

    if (!printWindow) {
        window.open(blobUrl, "_blank");
        return;
    }

    printWindow.location.href = blobUrl;
    printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
    });
}
