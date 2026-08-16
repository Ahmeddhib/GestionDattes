"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { VentesTableAdvanced } from "@/components/features/ventes/VentesTableAdvanced";
import { CreateVenteDialog } from "@/components/features/ventes/CreateVenteDialog";
import type { Vente } from "@/components/features/ventes/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import { ShoppingCart, Wallet } from "lucide-react";
import type { PdfBranding } from "@/lib/pdf-branding";

interface VentesPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
    ventes: Vente[];
    branding: PdfBranding;
}

export function VentesPageContent({
    ventes,
    saisonFiltre,
    saisonOuverte,
    branding,
}: VentesPageContentProps) {
    const { t } = useClientTranslations();

    const chiffreAffaires = ventes.reduce((sum, v) => sum + v.montant, 0);
    const totalEncaisse = ventes.reduce((sum, v) => sum + v.montantEncaisse, 0);
    const totalRestant = ventes.reduce((sum, v) => sum + v.montantRestant, 0);

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />
            {!saisonOuverte && <AucuneSaisonAlert canGererSaisons />}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-[#3D1C00] sm:gap-3 sm:text-3xl">
                        <ShoppingCart className="h-7 w-7 shrink-0 text-[#C17A2B] sm:h-8 sm:w-8" />
                        {t("finance.ventes.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("finance.ventes.description")}</p>
                </div>
                {!saisonFiltre.isReadOnly && saisonOuverte && <CreateVenteDialog saisonActive={saisonOuverte} />}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.ventes.montantTotal")}
                            </p>
                            <p className="text-3xl font-bold text-[#3D1C00] mt-2">{chiffreAffaires.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#FAF0DC] rounded-md flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                {t("finance.paiements.montantPaye")}
                            </p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{totalEncaisse.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-green-600" />
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
                <VentesTableAdvanced
                    data={ventes}
                    branding={branding}
                    saisonActive={saisonOuverte ?? undefined}
                />
            </div>
        </PageContainer>
    );
}
