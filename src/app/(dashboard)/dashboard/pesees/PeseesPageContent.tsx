"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PeseesTableAdvanced } from "@/components/features/pesees/PeseesTableAdvanced";
import { CreatePeseeDialog } from "@/components/features/pesees/CreatePeseeDialog";
import type { Pesee } from "@/components/features/pesees/columns";
import { Scale, Weight, TrendingUp } from "lucide-react";

interface PeseesPageContentProps {
    pesees: Pesee[];
}

export function PeseesPageContent({ pesees }: PeseesPageContentProps) {
    const { t } = useClientTranslations();

    const totalPesees = pesees.length;
    const poidsBrutTotal = pesees.reduce((sum, p) => sum + p.poidsBrutTotal, 0);
    const poidsNetTotal = pesees.reduce((sum, p) => sum + p.poidsNetTotal, 0);
    const tareTotal = pesees.reduce((sum, p) => sum + p.poidsTareTotal, 0);
    const pourcentageTare = poidsBrutTotal > 0 ? (tareTotal / poidsBrutTotal) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <Scale className="h-8 w-8 text-[#C17A2B]" />
                        {t("pesees.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("pesees.description")}</p>
                </div>
                <CreatePeseeDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("pesees.stats.total")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">
                                {totalPesees}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-[9px] flex items-center justify-center">
                            <Scale className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("pesees.stats.poidsBrutTotal")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">
                                {poidsBrutTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-[9px] flex items-center justify-center">
                            <Weight className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("pesees.stats.poidsNetTotal")}
                            </p>
                            <p className="text-3xl font-bold text-[#C17A2B] mt-2">
                                {poidsNetTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-[9px] flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("pesees.stats.pourcentageTare")}
                            </p>
                            <p className="text-3xl font-bold text-gray-600 mt-2">
                                {pourcentageTare.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {tareTotal.toFixed(0)} kg
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-[9px] flex items-center justify-center">
                            <Weight className="h-6 w-6 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm">
                <PeseesTableAdvanced data={pesees} />
            </div>
        </div>
    );
}
