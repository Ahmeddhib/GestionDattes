"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { X } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { TenantForInvoice } from "@/lib/bon-achat-pdf";
import { createBonsAchatColumns, type BonAchat } from "./columns";

interface BonsAchatTableAdvancedProps {
    data: BonAchat[];
    tenant: TenantForInvoice;
}

const ALL_AGRICULTEURS = "all";

export function BonsAchatTableAdvanced({ data, tenant }: BonsAchatTableAdvancedProps) {
    const { t } = useClientTranslations();
    const columns = createBonsAchatColumns(t, tenant);

    const [agriculteurId, setAgriculteurId] = useState<string>(ALL_AGRICULTEURS);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const agriculteurs = useMemo(() => {
        const map = new Map<string, string>();
        for (const bonAchat of data) {
            const a = bonAchat.Livraison.Agriculteur;
            map.set(a.id, `${a.nom} ${a.prenom} (${a.code})`);
        }
        return Array.from(map.entries());
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((bonAchat) => {
            if (agriculteurId !== ALL_AGRICULTEURS && bonAchat.Livraison.Agriculteur.id !== agriculteurId) {
                return false;
            }
            if (dateRange?.from) {
                const createdAt = new Date(bonAchat.createdAt);
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
                if (createdAt < from) return false;
            }
            if (dateRange?.to) {
                const createdAt = new Date(bonAchat.createdAt);
                const to = new Date(dateRange.to);
                to.setHours(23, 59, 59, 999);
                if (createdAt > to) return false;
            }
            return true;
        });
    }, [data, agriculteurId, dateRange]);

    const hasActiveFilters = agriculteurId !== ALL_AGRICULTEURS || !!dateRange?.from;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 px-1">
                <div className="min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("livraisons.agriculteur")}
                    </label>
                    <Select value={agriculteurId} onValueChange={setAgriculteurId}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value={ALL_AGRICULTEURS}>{t("common.all")}</SelectItem>
                            {agriculteurs.map(([id, label]) => (
                                <SelectItem key={id} value={id}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("bonAchat.periode")}
                    </label>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder={t("bonAchat.periode")}
                    />
                </div>

                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setAgriculteurId(ALL_AGRICULTEURS);
                            setDateRange(undefined);
                        }}
                        className="gap-1.5 text-[#3D1C00]/70"
                    >
                        <X className="h-3.5 w-3.5" />
                        {t("common.resetFilters")}
                    </Button>
                )}
            </div>

            <DataTableAdvanced
                columns={columns}
                data={filteredData}
                searchKey="numero"
                searchPlaceholder={t("bonAchat.searchPlaceholder")}
            />
        </div>
    );
}
