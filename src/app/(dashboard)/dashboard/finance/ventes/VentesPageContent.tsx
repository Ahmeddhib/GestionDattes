"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { VentesTableAdvanced } from "@/components/features/ventes/VentesTableAdvanced";
import { CreateVenteDialog } from "@/components/features/ventes/CreateVenteDialog";
import type { Vente } from "@/components/features/ventes/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { ShoppingCart, Wallet } from "lucide-react";

interface VentesPageContentProps {
    ventes: Vente[];
}

export function VentesPageContent({ ventes }: VentesPageContentProps) {
    const { t } = useClientTranslations();

    const chiffreAffaires = ventes.reduce((sum, v) => sum + v.montant, 0);
    const totalEncaisse = ventes.reduce((sum, v) => sum + v.montantEncaisse, 0);
    const totalRestant = ventes.reduce((sum, v) => sum + v.montantRestant, 0);

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <ShoppingCart className="h-8 w-8 text-[#C17A2B]" />
                        {t("finance.ventes.title")}
                    </h1>
                    <p className="text-gray-600 mt-2">{t("finance.ventes.description")}</p>
                </div>
                <CreateVenteDialog />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
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
                <VentesTableAdvanced data={ventes} />
            </div>
        </PageContainer>
    );
}
