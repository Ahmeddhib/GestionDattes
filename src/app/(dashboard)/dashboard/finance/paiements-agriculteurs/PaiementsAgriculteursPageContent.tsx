"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import {
    PaiementsAgriculteursTableServer,
    type AgriculteurOptionPaiement,
} from "@/components/features/paiements-agriculteurs/PaiementsAgriculteursTableServer";
import type { BonAchatAvecSolde } from "@/components/features/paiements-agriculteurs/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import type { PaginatedResult } from "@/lib/pagination";
import { HandCoins, Wallet } from "lucide-react";
import type { PdfBranding } from "@/lib/pdf-branding";

export interface TotauxPaiements {
    total: number;
    montantTotal: number;
    montantPaye: number;
    montantRestant: number;
}

interface PaiementsAgriculteursPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
    resultat: PaginatedResult<BonAchatAvecSolde>;
    /**
     * Totaux agrégés en base sur tout le jeu filtré. Le montant payé vient d'une
     * agrégation sur `PaiementAgriculteur` : le sommer depuis les lignes reçues
     * donnerait le total des dix bons affichés, sans signe visible d'erreur.
     */
    totaux: TotauxPaiements;
    agriculteurs: AgriculteurOptionPaiement[];
    branding: PdfBranding;
}

export function PaiementsAgriculteursPageContent({
    resultat,
    totaux,
    agriculteurs,
    saisonFiltre,
    saisonOuverte,
    branding,
}: PaiementsAgriculteursPageContentProps) {
    const { t } = useClientTranslations();

    const {
        montantTotal: totalMontant,
        montantPaye: totalPaye,
        montantRestant: totalRestant,
    } = totaux;

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />

            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <HandCoins className="h-8 w-8 text-[#C17A2B]" />
                    {t("finance.paiements.title")}
                </h1>
                <p className="text-muted-foreground mt-2">{t("finance.paiements.description")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("finance.paiements.montantTotal")}
                            </p>
                            <p className="text-3xl font-bold text-foreground mt-2">{totalMontant.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("finance.paiements.montantPaye")}
                            </p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{totalPaye.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <HandCoins className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
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

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <PaiementsAgriculteursTableServer
                    resultat={resultat}
                    agriculteurs={agriculteurs}
                    branding={branding}
                    saisonActive={saisonOuverte ?? undefined}
                />
            </div>
        </PageContainer>
    );
}
