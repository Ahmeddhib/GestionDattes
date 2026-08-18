"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DepensesTableServer } from "@/components/features/depenses/DepensesTableServer";
import type { PaginatedResult } from "@/lib/pagination";
import { CreateDepenseDialog } from "@/components/features/depenses/CreateDepenseDialog";
import type { Depense } from "@/components/features/depenses/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import { Wallet2 } from "lucide-react";
import type { PdfBranding } from "@/lib/pdf-branding";

export type TotauxDepenses = { total: number; montantTotal: number };

interface DepensesPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
    resultat: PaginatedResult<Depense>;
    /**
     * Totaux du jeu FILTRÉ, calculés en base. Ne jamais les recalculer depuis
     * `resultat.items` : ce tableau ne contient qu'une page.
     */
    totaux: TotauxDepenses;
    branding: PdfBranding;
}

export function DepensesPageContent({
    resultat,
    totaux,
    saisonFiltre,
    saisonOuverte,
    branding,
}: DepensesPageContentProps) {
    const { t } = useClientTranslations();

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />
            {!saisonOuverte && <AucuneSaisonAlert canGererSaisons />}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Wallet2 className="h-8 w-8 text-[#C17A2B]" />
                        {t("finance.depenses.title")}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t("finance.depenses.description")}</p>
                </div>
                {!saisonFiltre.isReadOnly && saisonOuverte && <CreateDepenseDialog saisonActive={saisonOuverte} />}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("common.total")}</p>
                            <p className="text-3xl font-bold text-foreground mt-2">{totaux.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Wallet2 className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("finance.depenses.montant")}
                            </p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{totaux.montantTotal.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-md flex items-center justify-center">
                            <Wallet2 className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <DepensesTableServer resultat={resultat} branding={branding} />
            </div>
        </PageContainer>
    );
}
