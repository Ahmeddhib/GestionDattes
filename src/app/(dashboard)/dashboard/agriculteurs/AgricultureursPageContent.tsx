"use client";

import { Users } from "lucide-react";
import { AgricultureursTableAdvanced } from "@/components/features/agriculteurs/AgricultureursTableAdvanced";
import { CreateAgriculteurDialog } from "@/components/features/agriculteurs/CreateAgriculteurDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Agriculteur = {
    id: string;
    code: string;
    cin: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    adresse: string | null;
    nbPalmiers: number;
    superficie: number | null;
    productionEstimee: number | null;
    regionId: string;
    region: {
        id: string;
        nom: string;
        code: string | null;
    };
};

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

type AgricultureursPageContentProps = {
    agriculteurs: Agriculteur[];
    regions: Region[];
};

export function AgricultureursPageContent({ agriculteurs, regions }: AgricultureursPageContentProps) {
    const { t } = useClientTranslations();

    // Calculer les statistiques
    const totalPalmiers = agriculteurs.reduce((acc, a) => acc + a.nbPalmiers, 0);
    const totalSuperficie = agriculteurs.reduce((acc, a) => acc + (a.superficie || 0), 0);
    const totalProduction = agriculteurs.reduce((acc, a) => acc + (a.productionEstimee || 0), 0);

    return (
        <div className="flex-1 space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <Users className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[#3D1C00]">
                                {t("agriculteurs.title")}
                            </h1>
                            <p className="text-sm text-[#3D1C00]/60">
                                {t("agriculteurs.description")}
                            </p>
                        </div>
                    </div>
                </div>
                <CreateAgriculteurDialog regions={regions} />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-[14px] border border-[#F0E0C0] bg-white p-6">
                    <div className="text-sm font-medium text-[#3D1C00]/60">
                        {t("agriculteurs.total")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#3D1C00]">
                        {agriculteurs.length}
                    </div>
                </div>
                <div className="rounded-[14px] border border-[#F0E0C0] bg-white p-6">
                    <div className="text-sm font-medium text-[#3D1C00]/60">
                        {t("agriculteurs.nbPalmiers")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#C17A2B]">
                        {totalPalmiers.toLocaleString()}
                    </div>
                </div>
                <div className="rounded-[14px] border border-[#F0E0C0] bg-white p-6">
                    <div className="text-sm font-medium text-[#3D1C00]/60">
                        {t("agriculteurs.superficie")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#C17A2B]">
                        {totalSuperficie.toFixed(1)}
                    </div>
                </div>
                <div className="rounded-[14px] border border-[#F0E0C0] bg-white p-6">
                    <div className="text-sm font-medium text-[#3D1C00]/60">
                        {t("agriculteurs.production")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#C17A2B]">
                        {totalProduction.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Advanced Table */}
            <AgricultureursTableAdvanced initialData={agriculteurs} regions={regions} />
        </div>
    );
}
