"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PeseesTableServer } from "@/components/features/pesees/PeseesTableServer";
import type { PeseeGroupee } from "@/components/features/pesees/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import type { PaginatedResult } from "@/lib/pagination";
import { Scale, Weight, TrendingUp } from "lucide-react";

export interface TotauxPesees {
    totalPesees: number;
    poidsBrutTotal: number;
    poidsTareTotal: number;
    poidsNetTotal: number;
}

interface PeseesPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    resultat: PaginatedResult<PeseeGroupee>;
    /**
     * Totaux agrégés en base sur tout le jeu filtré. Les recalculer depuis
     * `resultat.items` donnerait les totaux des dix livraisons affichées, sans
     * aucun signe visible que le chiffre est faux.
     */
    totaux: TotauxPesees;
}

export function PeseesPageContent({ resultat, totaux, saisonFiltre }: PeseesPageContentProps) {
    const { t } = useClientTranslations();

    const { totalPesees, poidsBrutTotal, poidsNetTotal, poidsTareTotal: tareTotal } = totaux;
    const pourcentageTare = poidsBrutTotal > 0 ? (tareTotal / poidsBrutTotal) * 100 : 0;

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />

            {/* En-tête */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Scale className="h-8 w-8 text-[#C17A2B]" />
                        {t("pesees.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t("pesees.description")}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("pesees.stats.total")}
                            </p>
                            <p className="text-3xl font-bold text-foreground mt-2">
                                {totalPesees}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Scale className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("pesees.stats.poidsBrutTotal")}
                            </p>
                            <p className="text-3xl font-bold text-foreground mt-2">
                                {poidsBrutTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-md flex items-center justify-center">
                            <Weight className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("pesees.stats.poidsNetTotal")}
                            </p>
                            <p className="text-3xl font-bold text-[#C17A2B] mt-2">
                                {poidsNetTotal.toFixed(0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">kg</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("pesees.stats.pourcentageTare")}
                            </p>
                            <p className="text-3xl font-bold text-muted-foreground mt-2">
                                {pourcentageTare.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {tareTotal.toFixed(0)} kg
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <Weight className="h-6 w-6 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border border-border shadow-sm">
                <PeseesTableServer resultat={resultat} />
            </div>
        </PageContainer>
    );
}
