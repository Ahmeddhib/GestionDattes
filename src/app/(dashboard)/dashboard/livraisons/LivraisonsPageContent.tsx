"use client";

import { Truck } from "lucide-react";
import { LivraisonsTableAdvanced } from "@/components/features/livraisons/LivraisonsTableAdvanced";
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

type LivraisonsPageContentProps = {
    livraisons: Livraison[];
    canEditAcceptedQuantity: boolean;
    saisonFiltre: SaisonFiltreProps;
    saisonOuverte: SaisonActive | null;
};

export function LivraisonsPageContent({
    livraisons,
    canEditAcceptedQuantity,
    saisonFiltre,
    saisonOuverte,
}: LivraisonsPageContentProps) {
    const { t } = useClientTranslations();

    // Calculer les statistiques
    const totalQuantity = livraisons.reduce((acc, l) => acc + l.quantiteKg, 0);

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const thisMonth = livraisons.filter(
        (l) => new Date(l.dateLivraison) >= thisMonthStart
    ).length;

    const thisYear = livraisons.filter(
        (l) => new Date(l.dateLivraison) >= thisYearStart
    ).length;

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
                            <h1 className="text-2xl font-bold text-[#3D1C00] sm:text-3xl">
                                {t("livraisons.title")}
                            </h1>
                            <p className="text-sm text-[#3D1C00]/60">
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
                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("livraisons.total")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">
                                {livraisons.length}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("livraisons.thisMonth")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">{thisMonth}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("livraisons.thisYear")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">{thisYear}</p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>

                <div className="rounded-[14px] border border-[#C17A2B]/20 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("livraisons.totalQuantity")}
                            </p>
                            <p className="text-2xl font-bold text-[#3D1C00]">
                                {totalQuantity.toFixed(0)} {t("livraisons.kg")}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Truck className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <LivraisonsTableAdvanced
                livraisons={livraisons}
                canEditAcceptedQuantity={canEditAcceptedQuantity}
            />
        </PageContainer>
    );
}
