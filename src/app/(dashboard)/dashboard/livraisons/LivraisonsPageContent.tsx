"use client";

import { Truck } from "lucide-react";
import { LivraisonsTableServer } from "@/components/features/livraisons/LivraisonsTableServer";
import type { PaginatedResult } from "@/lib/pagination";
import { NouvellePeseeWizard } from "@/components/features/livraisons/NouvellePeseeWizard";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";
import { SaisonFilterBar, type SaisonFiltreProps } from "@/components/shared/SaisonFilterBar";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";

type Livraison = {
    id: string;
    numeroLot: string;
    dateLivraison: Date;
    quantiteKg: number;
    quantiteLivree: number;
    quantiteAcceptee: number;
    agriculteur?: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
        cin: string;
    };
    _count?: {
        echantillons: number;
        pretsCaisses: number;
        stocksDates: number;
        pesees: number;
    };
};

export type TotauxLivraisons = {
    total: number;
    quantiteTotale: number;
    ceMois: number;
    cetteAnnee: number;
};

type LivraisonsPageContentProps = {
    resultat: PaginatedResult<Livraison>;
    /**
     * Totaux du jeu de données FILTRÉ, calculés en base.
     *
     * ⚠️ Ne jamais les recalculer depuis `resultat.items` : depuis la
     * pagination serveur, ce tableau ne contient qu'une page. Le total
     * afficherait « la somme des dix lignes visibles », sans erreur visible.
     */
    totaux: TotauxLivraisons;
    canEditAcceptedQuantity: boolean;
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
};

export function LivraisonsPageContent({
    resultat,
    totaux,
    canEditAcceptedQuantity,
    saisonFiltre,
    saisonOuverte,
}: LivraisonsPageContentProps) {
    const { t } = useClientTranslations();

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {t("livraisons.title")}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t("livraisons.description")}
                            </p>
                        </div>
                    </div>
                </div>
                {/* La création est impossible sur une saison clôturée (lecture
                    seule) comme lorsqu'aucune saison n'est ouverte. Le blocage
                    réel reste côté serveur. */}
                {!saisonFiltre.isReadOnly && saisonOuverte && <NouvellePeseeWizard saisonActive={saisonOuverte} />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <SaisonFilterBar {...saisonFiltre} />
            </div>

            {!saisonOuverte && <AucuneSaisonAlert canGererSaisons />}

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("livraisons.total")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                {totaux.total}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("livraisons.thisMonth")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">{totaux.ceMois}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("livraisons.thisYear")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">{totaux.cetteAnnee}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t("livraisons.totalQuantity")}
                            </p>
                            <p className="text-2xl font-bold text-foreground">
                                {totaux.quantiteTotale.toFixed(0)} {t("livraisons.kg")}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table : pagination, tri et recherche exécutés par la base. */}
            <LivraisonsTableServer
                resultat={resultat}
                canEditAcceptedQuantity={canEditAcceptedQuantity}
            />
        </PageContainer>
    );
}
