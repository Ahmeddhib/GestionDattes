"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { StockDattesTableAdvanced } from "@/components/features/stock-dattes/StockDattesTableAdvanced";
import type { StockDateGroupe } from "@/components/features/stock-dattes/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { Grape, Warehouse } from "lucide-react";

interface StockDattesPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    stockDates: StockDateGroupe[];
    saisonId?: string;
}

export function StockDattesPageContent({
    stockDates,
    saisonFiltre,
    saisonId,
}: StockDattesPageContentProps) {
    const { t } = useClientTranslations();

    // Ces sommes restent justes : `stockDates` contient TOUS les types du filtre
    // courant, chacun déjà agrégé en base sur l'intégralité de ses lots. Ce n'est
    // pas le cas des modules paginés, où sommer les lignes reçues ne donnerait que
    // le total de la page affichée.
    const quantiteTotale = stockDates.reduce((sum, s) => sum + s.quantiteTotale, 0);
    const quantiteDisponible = stockDates.reduce((sum, s) => sum + s.quantiteDisponible, 0);

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />

            <div>
                <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                    <Grape className="h-8 w-8 text-[#C17A2B]" />
                    {t("stockDattes.title")}
                </h1>
                <p className="text-gray-600 mt-2">{t("stockDattes.description")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("stockDattes.stats.types")}</p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{stockDates.length}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <Grape className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("stockDattes.stats.quantiteTotale")}</p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{quantiteTotale.toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-md flex items-center justify-center">
                            <Warehouse className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t("stockDattes.stats.quantiteDisponible")}</p>
                            <p className="text-3xl font-bold text-[#C17A2B] mt-2">{quantiteDisponible.toFixed(0)}</p>
                            <p className="text-xs text-gray-500 mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <Warehouse className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <StockDattesTableAdvanced data={stockDates} saisonId={saisonId} />
            </div>
        </PageContainer>
    );
}
