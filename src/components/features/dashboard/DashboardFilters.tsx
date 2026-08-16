"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { PeriodeDashboard } from "@/types/dashboard";

type Saison = { id: string; nom: string };

interface DashboardFiltersProps {
    saisons: Saison[];
    currentPeriode: PeriodeDashboard;
    currentSaisonId?: string;
}

export function DashboardFilters({ saisons, currentPeriode, currentSaisonId }: DashboardFiltersProps) {
    const router = useRouter();
    const { t } = useClientTranslations();

    const [periode, setPeriode] = useState<PeriodeDashboard>(currentPeriode);
    const [saisonId, setSaisonId] = useState(currentSaisonId || "");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    function applyFilters() {
        const params = new URLSearchParams();
        params.set("periode", periode);
        if (periode === "saison" && saisonId) {
            params.set("saisonId", saisonId);
        }
        if (periode === "personnalisee" && dateRange?.from && dateRange?.to) {
            params.set("dateFrom", dateRange.from.toISOString());
            params.set("dateTo", dateRange.to.toISOString());
        }
        router.push(`${ROUTES.DASHBOARD}?${params.toString()}`);
    }

    return (
        <div className="grid grid-cols-1 items-end gap-3 rounded-lg border border-[#F0E0C0] bg-white p-4 shadow-sm dark:border-[#5C2D00] dark:bg-[#2A1800] sm:grid-cols-2 xl:flex xl:flex-wrap">
            <div className="min-w-0 xl:min-w-45">
                <label className="mb-1 block text-xs text-[#3D1C00]/60 dark:text-[#B08A5E]">{t("dashboard.filters.periode")}</label>
                <Select value={periode} onValueChange={(v) => setPeriode(v as PeriodeDashboard)}>
                    <SelectTrigger className="w-full rounded-sm border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="jour">{t("dashboard.filters.jour")}</SelectItem>
                        <SelectItem value="semaine">{t("dashboard.filters.semaine")}</SelectItem>
                        <SelectItem value="mois">{t("dashboard.filters.mois")}</SelectItem>
                        <SelectItem value="annee">{t("dashboard.filters.annee")}</SelectItem>
                        <SelectItem value="saison">{t("dashboard.filters.saisonOption")}</SelectItem>
                        <SelectItem value="personnalisee">{t("dashboard.filters.personnalisee")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {periode === "saison" && (
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60 dark:text-[#B08A5E]">{t("dashboard.filters.saison")}</label>
                    <Select value={saisonId} onValueChange={setSaisonId}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue placeholder={t("dashboard.filters.selectSaison")} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {saisons.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                    {s.nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {periode === "personnalisee" && (
                <div className="min-w-0">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60 dark:text-[#B08A5E]">{t("dashboard.filters.dateRange")}</label>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
            )}

            <Button
                type="button"
                onClick={applyFilters}
                className="w-full gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F] xl:w-auto"
            >
                <Filter className="h-4 w-4" />
                {t("dashboard.filters.apply")}
            </Button>
        </div>
    );
}
