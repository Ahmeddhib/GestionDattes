"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DepensesTableAdvanced } from "@/components/features/depenses/DepensesTableAdvanced";
import { CreateDepenseDialog } from "@/components/features/depenses/CreateDepenseDialog";
import type { Depense } from "@/components/features/depenses/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { Wallet2 } from "lucide-react";

interface DepensesPageContentProps {
    depenses: Depense[];
}

export function DepensesPageContent({ depenses }: DepensesPageContentProps) {
    const { t } = useClientTranslations();

    const total = depenses.length;
    const montantTotal = depenses.reduce((sum, d) => sum + d.montant, 0);

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <Wallet2 className="h-8 w-8 text-[#C17A2B]" />
                        {t("finance.depenses.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("finance.depenses.description")}</p>
                </div>
                <CreateDepenseDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("common.total")}</p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{total}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <Wallet2 className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.depenses.montant")}
                            </p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{montantTotal.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-md flex items-center justify-center">
                            <Wallet2 className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <DepensesTableAdvanced data={depenses} />
            </div>
        </PageContainer>
    );
}
