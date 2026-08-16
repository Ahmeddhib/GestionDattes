"use client";

import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { FileDown, FileSpreadsheet, X } from "lucide-react";
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
import {
    exportPaiementsAgriculteursToPDF,
    exportPaiementsAgriculteursToExcel,
} from "@/lib/export-utils";
import { createPaiementsColumns, type BonAchatAvecSolde } from "./columns";
import type { PdfBranding } from "@/lib/pdf-branding";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";

interface PaiementsAgriculteursTableAdvancedProps {
    data: BonAchatAvecSolde[];
    branding: PdfBranding;
    saisonActive?: SaisonActive;
}

const ALL_AGRICULTEURS = "all";
const ALL_STATUTS = "all";

export function PaiementsAgriculteursTableAdvanced({
    data,
    branding,
    saisonActive,
}: PaiementsAgriculteursTableAdvancedProps) {
    const { t } = useClientTranslations();
    const columns = createPaiementsColumns(t, saisonActive);

    const [agriculteurId, setAgriculteurId] = useState<string>(ALL_AGRICULTEURS);
    const [statut, setStatut] = useState<string>(ALL_STATUTS);
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
            if (statut !== ALL_STATUTS && bonAchat.statut !== statut) {
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
    }, [data, agriculteurId, statut, dateRange]);

    const hasActiveFilters = agriculteurId !== ALL_AGRICULTEURS || statut !== ALL_STATUTS || !!dateRange?.from;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void exportPaiementsAgriculteursToPDF(filteredData, branding)}
                    className="w-full rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC] sm:w-auto"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    {t("common.exportPDF")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportPaiementsAgriculteursToExcel(filteredData)}
                    className="w-full rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC] sm:w-auto"
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t("common.exportExcel")}
                </Button>
            </div>
            <div className="grid grid-cols-1 items-end gap-3 px-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="min-w-0 xl:min-w-55">
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

                <div className="min-w-0 xl:min-w-45">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("finance.paiements.statut")}
                    </label>
                    <Select value={statut} onValueChange={setStatut}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value={ALL_STATUTS}>{t("common.all")}</SelectItem>
                            <SelectItem value="EN_ATTENTE">{t("finance.paiements.statutEnAttente")}</SelectItem>
                            <SelectItem value="PARTIEL">{t("finance.paiements.statutPartiel")}</SelectItem>
                            <SelectItem value="PAYE">{t("finance.paiements.statutPaye")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="min-w-0">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("bonAchat.periode")}</label>
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
                            setStatut(ALL_STATUTS);
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
