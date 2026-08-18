"use client";

import { MoreHorizontal, Printer, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { downloadBonAchatPDF, printBonAchatPDF, type BonAchatForInvoice, type TenantForInvoice } from "@/lib/bon-achat-pdf";

interface BonAchatActionsProps {
    bonAchat: BonAchatForInvoice;
    tenant: TenantForInvoice;
}

export function BonAchatActions({ bonAchat, tenant }: BonAchatActionsProps) {
    const { t } = useClientTranslations();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <span className="sr-only">{t("common.actions")}</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card">
                <DropdownMenuItem onClick={() => void printBonAchatPDF(bonAchat, tenant)} className="gap-2">
                    <Printer className="h-4 w-4 text-[#C17A2B]" />
                    {t("bonAchat.imprimer")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void downloadBonAchatPDF(bonAchat, tenant)} className="gap-2">
                    <FileDown className="h-4 w-4 text-[#C17A2B]" />
                    {t("bonAchat.telechargerPdf")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
