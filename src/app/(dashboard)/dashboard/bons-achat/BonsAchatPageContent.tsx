"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { BonsAchatTableServer, type AgriculteurOption } from "@/components/features/bons-achat/BonsAchatTableServer";
import type { PaginatedResult } from "@/lib/pagination";
import type { BonAchat } from "@/components/features/bons-achat/columns";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { Receipt, Wallet } from "lucide-react";

export type TotauxBonsAchat = {
    total: number;
    montantTotal: number;
    montantPaye: number;
    montantRestant: number;
};

interface BonsAchatPageContentProps {
    saisonFiltre: SaisonFiltreProps;
    resultat: PaginatedResult<BonAchat>;
    /** Totaux du jeu FILTRÉ, calculés en base — jamais depuis `resultat.items`. */
    totaux: TotauxBonsAchat;
    agriculteurs: AgriculteurOption[];
    tenant: { name: string; address: string | null; phone: string | null; email: string | null };
}

export function BonsAchatPageContent({
    resultat,
    totaux,
    agriculteurs,
    tenant,
    saisonFiltre,
}: BonsAchatPageContentProps) {
    const { t } = useClientTranslations();

    return (
        <PageContainer>
            <SaisonFilterBar {...saisonFiltre} />

            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-[#C17A2B]" />
                    {t("bonAchat.title")}
                </h1>
                <p className="text-muted-foreground mt-2">{t("bonAchat.pageDescription")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("bonAchat.stats.total")}</p>
                            <p className="text-3xl font-bold text-foreground mt-2">{totaux.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{t("bonAchat.stats.montantTotal")}</p>
                            <p className="text-3xl font-bold text-[#C17A2B] mt-2">{totaux.montantTotal.toFixed(2)}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-md flex items-center justify-center">
                            <Wallet className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm">
                <BonsAchatTableServer
                    resultat={resultat}
                    agriculteurs={agriculteurs}
                    tenant={tenant}
                />
            </div>
        </PageContainer>
    );
}
