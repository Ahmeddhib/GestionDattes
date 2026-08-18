"use client";

import { MapPin } from "lucide-react";
import { RegionsTableAdvanced } from "@/components/features/regions/RegionsTableAdvanced";
import { CreateRegionDialog } from "@/components/features/regions/CreateRegionDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";

type Region = {
    id: string;
    nom: string;
    code: string | null;
    _count?: {
        agriculteurs: number;
        users: number;
    };
};

type RegionsPageContentProps = {
    regions: Region[];
};

export function RegionsPageContent({ regions }: RegionsPageContentProps) {
    const { t } = useClientTranslations();

    const totalAgriculteurs = regions.reduce((acc, r) => acc + (r._count?.agriculteurs || 0), 0);
    const totalUsers = regions.reduce((acc, r) => acc + (r._count?.users || 0), 0);

    return (
        <PageContainer>
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                            <MapPin className="h-6 w-6 text-[#C17A2B]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                                {t("regions.title")}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t("regions.description")}
                            </p>
                        </div>
                    </div>
                </div>
                <CreateRegionDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                        {t("regions.total")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-foreground">
                        {regions.length}
                    </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                        {t("regions.agriculteurs")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#C17A2B]">
                        {totalAgriculteurs}
                    </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                    <div className="text-sm font-medium text-muted-foreground">
                        {t("regions.users")}
                    </div>
                    <div className="mt-2 text-3xl font-bold text-[#C17A2B]">
                        {totalUsers}
                    </div>
                </div>
            </div>

            {/* Advanced Table */}
            <RegionsTableAdvanced initialData={regions} />
        </PageContainer>
    );
}
