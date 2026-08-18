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
        <div className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-sm backdrop-blur-sm sm:grid-cols-2 xl:flex xl:flex-wrap">
            <div className="min-w-0 xl:min-w-45">
                <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("finance.bilan.periode")}</label>
                <Select value={periode} onValueChange={setPeriode}>
                    <SelectTrigger className="w-full rounded-xl border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jour">{t("finance.bilan.periodeJour")}</SelectItem>
                        <SelectItem value="mois">{t("finance.bilan.periodeMois")}</SelectItem>
                        <SelectItem value="annee">{t("finance.bilan.periodeAnnee")}</SelectItem>
                        <SelectItem value="saison">{t("finance.bilan.periodeSaison")}</SelectItem>
                        <SelectItem value="personnalisee">{t("finance.bilan.periodePersonnalisee")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {periode === "saison" && (
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("finance.bilan.selectSaison")}</label>
                    <Select value={saisonId} onValueChange={setSaisonId}>
                        <SelectTrigger className="w-full rounded-xl border-border">
                            <SelectValue placeholder={t("finance.bilan.selectSaison")} />
                        </SelectTrigger>
                        <SelectContent>
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
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("bonAchat.periode")}</label>
                    <DateRangePicker value={dateRange} onChange={setDateRange} />
                </div>
            )}

            <Button
                type="button"
                onClick={applyFilters}
                className="w-full gap-2 rounded-xl bg-linear-to-r from-[#b96f1d] to-[#dfa84e] font-semibold text-white shadow-sm hover:brightness-105 xl:w-auto"
            >
                <Filter className="h-4 w-4" />
                {t("common.search")}
            </Button>
        </div>
    );
}
