"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { SaisonsTableAdvanced } from "@/components/features/saisons/SaisonsTableAdvanced";
import { CreateSaisonDialog } from "@/components/features/saisons/CreateSaisonDialog";
import type { Saison } from "@/components/features/saisons/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { CalendarRange } from "lucide-react";

interface SaisonsPageContentProps {
    saisons: Saison[];
}

export function SaisonsPageContent({ saisons }: SaisonsPageContentProps) {
    const { t } = useClientTranslations();

    const total = saisons.length;
    const ouvertes = saisons.filter((s) => s.statut === "OUVERTE").length;

    return (
        <PageContainer>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <CalendarRange className="h-8 w-8 text-[#C17A2B]" />
                        {t("finance.saisons.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("finance.saisons.description")}</p>
                </div>
                <CreateSaisonDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("common.total")}</p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{total}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <CalendarRange className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("finance.saisons.ouverte")}</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{ouvertes}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <CalendarRange className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <SaisonsTableAdvanced data={saisons} />
            </div>
        </PageContainer>
    );
}
