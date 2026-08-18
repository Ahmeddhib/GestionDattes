"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import {
    VentesTableServer,
    type ClientOption,
} from "@/components/features/ventes/VentesTableServer";
import { CreateVenteDialog } from "@/components/features/ventes/CreateVenteDialog";
import type { Vente } from "@/components/features/ventes/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import type { PaginatedResult } from "@/lib/pagination";
import { ShoppingCart, Wallet } from "lucide-react";
import type { PdfBranding } from "@/lib/pdf-branding";

export interface TotauxVentes {
    total: number;
    chiffreAffaires: number;
    totalEncaisse: number;
    totalRestant: number;
}

interface VentesPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
    resultat: PaginatedResult<Vente>;
    /**
     * Totaux agrégés en base sur tout le jeu filtré. L'encaissé vient de
     * `EncaissementClient`, agrégé avec le même filtre : le sommer depuis les
     * lignes reçues donnerait le total des dix ventes affichées.
     */
    totaux: TotauxVentes;
    clients: ClientOption[];
    branding: PdfBranding;
}

export function VentesPageContent({
    resultat,
    totaux,
    clients,
    saisonFiltre,
    saisonOuverte,
    branding,
}: VentesPageContentProps) {
    const { t } = useClientTranslations();

    const { chiffreAffaires, totalEncaisse, totalRestant } = totaux;

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
                <VentesTableServer
                    resultat={resultat}
                    clients={clients}
                    branding={branding}
                    saisonActive={saisonOuverte ?? undefined}
                />
            </div>
        </PageContainer>
    );
}
