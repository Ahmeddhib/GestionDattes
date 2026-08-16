import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "./RefreshButton";
import { getServerTranslations } from "@/i18n/server";
import type { ReactNode } from "react";

interface SaisonActive {
    nom: string;
    statut: string;
    dateFin: Date;
}

interface DashboardHeaderProps {
    wakalaName: string;
    saisonActive: SaisonActive | null;
    canSeeSaison: boolean;
    filters?: ReactNode;
    children?: ReactNode;
}

export async function DashboardHeader({ wakalaName, saisonActive, canSeeSaison, filters, children }: DashboardHeaderProps) {
    const t = await getServerTranslations();
    return (
        <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#2C1A00] dark:text-[#F5E6C8]">{t("dashboard.title")}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-[#B08A5E]">
                        <span>{wakalaName}</span>
                        {canSeeSaison && (
                            <>
                                <span className="text-gray-300 dark:text-[#5C2D00]">•</span>
                                {saisonActive ? (
                                    <span className="flex items-center gap-1.5">
                                        {saisonActive.nom}
                                        <Badge className="bg-green-600 hover:bg-green-700">{t("finance.saisons.ouverte")}</Badge>
                                    </span>
                                ) : (
                                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                                        {t("dashboard.noSaisonOuverte")}
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <RefreshButton />
            </div>

            {filters}
            {children}
        </div>
    );
}
