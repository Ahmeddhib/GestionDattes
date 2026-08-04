"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Filter } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type Saison = { id: string; nom: string };

interface FinanceFilterBarProps {
    saisons: Saison[];
    currentPeriode: string;
    currentSaisonId?: string;
}

export function FinanceFilterBar({ saisons, currentPeriode, currentSaisonId }: FinanceFilterBarProps) {
    const { t } = useClientTranslations();
    const router = useRouter();

    const [periode, setPeriode] = useState(currentPeriode);
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
        router.push(`/dashboard/finance?${params.toString()}`);
    }

    return (
        <div className="flex flex-wrap items-end gap-3 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="min-w-45">
                <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("finance.bilan.periode")}</label>
                <Select value={periode} onValueChange={setPeriode}>
                    <SelectTrigger className="w-full rounded-sm border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="jour">{t("finance.bilan.periodeJour")}</SelectItem>
                        <SelectItem value="mois">{t("finance.bilan.periodeMois")}</SelectItem>
                        <SelectItem value="annee">{t("finance.bilan.periodeAnnee")}</SelectItem>
                        <SelectItem value="saison">{t("finance.bilan.periodeSaison")}</SelectItem>
                        <SelectItem value="personnalisee">{t("finance.bilan.periodePersonnalisee")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {periode === "saison" && (
                <div className="min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("finance.bilan.selectSaison")}</label>
                    <Select value={saisonId} onValueChange={setSaisonId}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue placeholder={t("finance.bilan.selectSaison")} />
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
                <div>
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("bonAchat.periode")}</label>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
            )}

            <Button
                type="button"
                onClick={applyFilters}
                className="gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
            >
                <Filter className="h-4 w-4" />
                {t("common.search")}
            </Button>
        </div>
    );
}
