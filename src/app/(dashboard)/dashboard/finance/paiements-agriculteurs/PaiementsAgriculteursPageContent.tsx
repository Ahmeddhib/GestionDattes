"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PaiementsAgriculteursTableAdvanced } from "@/components/features/paiements-agriculteurs/PaiementsAgriculteursTableAdvanced";
import type { BonAchatAvecSolde } from "@/components/features/paiements-agriculteurs/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { HandCoins, Wallet } from "lucide-react";

interface PaiementsAgriculteursPageContentProps {
    bonsAchat: BonAchatAvecSolde[];
}

export function PaiementsAgriculteursPageContent({ bonsAchat }: PaiementsAgriculteursPageContentProps) {
    const { t } = useClientTranslations();

    const totalMontant = bonsAchat.reduce((sum, b) => sum + b.montant, 0);
    const totalPaye = bonsAchat.reduce((sum, b) => sum + b.montantPaye, 0);
    const totalRestant = bonsAchat.reduce((sum, b) => sum + b.montantRestant, 0);

    return (
        <PageContainer>
            <div>
                <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                    <HandCoins className="h-8 w-8 text-[#C17A2B]" />
                    {t("finance.paiements.title")}
                </h1>
                <p className="text-gray-600 mt-2">{t("finance.paiements.description")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.paiements.montantTotal")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{totalMontant.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.paiements.montantPaye")}
                            </p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{totalPaye.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <HandCoins className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.paiements.montantRestant")}
                            </p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{totalRestant.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <PaiementsAgriculteursTableAdvanced data={bonsAchat} />
            </div>
        </PageContainer>
    );
}
