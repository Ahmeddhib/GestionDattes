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
import { exportVentesToPDF, exportVentesToExcel } from "@/lib/export-utils";
import { createVentesColumns, type Vente } from "./columns";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import { EditVenteDialog } from "./EditVenteDialog";
import type { PdfBranding } from "@/lib/pdf-branding";

interface VentesTableAdvancedProps {
    data: Vente[];
    branding: PdfBranding;
    saisonActive?: SaisonActive;
}

const ALL_CLIENTS = "all";
const ALL_STATUTS = "all";

export function VentesTableAdvanced({ data, branding, saisonActive }: VentesTableAdvancedProps) {
    const { t } = useClientTranslations();

    const [clientId, setClientId] = useState<string>(ALL_CLIENTS);
    const [statut, setStatut] = useState<string>(ALL_STATUTS);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleEdit = (vente: Vente) => {
        setSelectedVente(vente);
        setEditDialogOpen(true);
    };

    const columns = createVentesColumns(t, handleEdit, branding, saisonActive);

    const clients = useMemo(() => {
        const map = new Map<string, string>();
        for (const vente of data) {
            map.set(vente.Client.id, vente.Client.nom);
        }
        return Array.from(map.entries());
    }, [data]);

    const filteredData = useMemo(() => {
        return data.filter((vente) => {
            if (clientId !== ALL_CLIENTS && vente.Client.id !== clientId) return false;
            if (statut !== ALL_STATUTS && vente.statut !== statut) return false;
            if (dateRange?.from) {
                const createdAt = new Date(vente.createdAt);
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
                if (createdAt < from) return false;
            }
            if (dateRange?.to) {
                const createdAt = new Date(vente.createdAt);
                const to = new Date(dateRange.to);
                to.setHours(23, 59, 59, 999);
                if (createdAt > to) return false;
            }
            return true;
        });
    }, [data, clientId, statut, dateRange]);

    const hasActiveFilters = clientId !== ALL_CLIENTS || statut !== ALL_STATUTS || !!dateRange?.from;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 px-1 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void exportVentesToPDF(filteredData, branding)}
                    className="w-full rounded-md border-border hover:bg-muted sm:w-auto"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    {t("common.exportPDF")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportVentesToExcel(filteredData)}
                    className="w-full rounded-md border-border hover:bg-muted sm:w-auto"
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t("common.exportExcel")}
                </Button>
            </div>
            <div className="grid grid-cols-1 items-end gap-3 px-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-muted-foreground">{t("finance.ventes.client")}</label>
                    <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                            <SelectItem value={ALL_CLIENTS}>{t("common.all")}</SelectItem>
                            {clients.map(([id, nom]) => (
                                <SelectItem key={id} value={id}>
                                    {nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="min-w-0 xl:min-w-45">
                    <label className="mb-1 block text-xs text-muted-foreground">
                        {t("finance.paiements.statut")}
                    </label>
                    <Select value={statut} onValueChange={setStatut}>
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card">
                            <SelectItem value={ALL_STATUTS}>{t("common.all")}</SelectItem>
                            <SelectItem value="EN_ATTENTE">{t("finance.paiements.statutEnAttente")}</SelectItem>
                            <SelectItem value="PARTIEL">{t("finance.paiements.statutPartiel")}</SelectItem>
                            <SelectItem value="PAYE">{t("finance.paiements.statutPaye")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="min-w-0">
                    <label className="mb-1 block text-xs text-muted-foreground">{t("bonAchat.periode")}</label>
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
                            setClientId(ALL_CLIENTS);
                            setStatut(ALL_STATUTS);
                            setDateRange(undefined);
                        }}
                        className="gap-1.5 text-muted-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        {t("common.resetFilters")}
                    </Button>
                )}
            </div>

            <DataTableAdvanced columns={columns} data={filteredData} />

            <EditVenteDialog vente={selectedVente} open={editDialogOpen} onOpenChange={setEditDialogOpen} />
        </div>
    );
}
