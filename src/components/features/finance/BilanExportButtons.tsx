"use client";

import { FileDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { downloadBilanPDF, printBilanPDF, type BilanForPdf, type TenantForBilanPdf } from "@/lib/finance-pdf";

interface BilanExportButtonsProps {
    bilan: BilanForPdf;
    tenant: TenantForBilanPdf;
}

export function BilanExportButtons({ bilan, tenant }: BilanExportButtonsProps) {
    const { t } = useClientTranslations();

    return (
        <div className="flex gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={() => void printBilanPDF(bilan, tenant)}
                className="gap-2 rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
            >
                <Printer className="h-4 w-4" />
                {t("bonAchat.imprimer")}
            </Button>
            <Button
                type="button"
                variant="outline"
                onClick={() => void downloadBilanPDF(bilan, tenant)}
                className="gap-2 rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
            >
                <FileDown className="h-4 w-4" />
                {t("finance.bilan.exportPdf")}
            </Button>
        </div>
    );
}
