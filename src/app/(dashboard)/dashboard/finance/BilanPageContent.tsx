"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";
import { FinanceStatsCards } from "@/components/features/finance/FinanceStatsCards";
import { FinanceFilterBar } from "@/components/features/finance/FinanceFilterBar";
import { BilanExportButtons } from "@/components/features/finance/BilanExportButtons";
import type { TenantForBilanPdf } from "@/lib/finance-pdf";
import type { BilanGlobal } from "@/services/finance.service";
import { Wallet } from "lucide-react";

interface BilanPageContentProps {
    bilan: BilanGlobal;
    tenant: TenantForBilanPdf;
    saisons: { id: string; nom: string }[];
    currentPeriode: string;
    currentSaisonId?: string;
}

export function BilanPageContent({
    bilan,
    tenant,
    saisons,
    currentPeriode,
    currentSaisonId,
}: BilanPageContentProps) {
    const { t } = useClientTranslations();

    return (
        <PageContainer>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-[#C17A2B]" />
                        {t("finance.bilan.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {t("finance.bilan.description")} — {bilan.periodeLabel}
                    </p>
                </div>
                <BilanExportButtons bilan={bilan} tenant={tenant} />
            </div>

            <FinanceFilterBar
                saisons={saisons}
                currentPeriode={currentPeriode}
                currentSaisonId={currentSaisonId}
            />

            <FinanceStatsCards bilan={bilan} />
        </PageContainer>
    );
}
