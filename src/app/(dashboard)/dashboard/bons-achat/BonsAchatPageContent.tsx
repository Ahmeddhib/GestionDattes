"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { BonsAchatTableAdvanced } from "@/components/features/bons-achat/BonsAchatTableAdvanced";
import type { BonAchat } from "@/components/features/bons-achat/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { Receipt, Wallet } from "lucide-react";

interface BonsAchatPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    bonsAchat: BonAchat[];
    tenant: { name: string; address: string | null; phone: string | null; email: string | null };
}

export function BonsAchatPageContent({ bonsAchat, tenant, saisonFiltre }: BonsAchatPageContentProps) {
    const { t } = useClientTranslations();

    const total = bonsAchat.length;
    const montantTotal = bonsAchat.reduce((sum, b) => sum + b.montant, 0);

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />

            <div>
                <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-[#C17A2B]" />
                    {t("bonAchat.title")}
                </h1>
                <p className="text-gray-600 mt-2">{t("bonAchat.pageDescription")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("bonAchat.stats.total")}</p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{total}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("bonAchat.stats.montantTotal")}</p>
                            <p className="text-3xl font-bold text-[#C17A2B] mt-2">{montantTotal.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <BonsAchatTableAdvanced data={bonsAchat} tenant={tenant} />
            </div>
        </PageContainer>
    );
}
