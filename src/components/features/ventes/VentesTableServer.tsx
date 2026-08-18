"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { FileDown, FileSpreadsheet, Loader2, X } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableServer } from "@/components/ui/data-table-server";
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
import { useTableQueryState } from "@/hooks/useTableQueryState";
import { useExportFiltre } from "@/hooks/useExportFiltre";
import { getVentesExportAction } from "@/actions/ventes/get-ventes-page.action";
import { createVentesColumns, type Vente } from "./columns";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import { EditVenteDialog } from "./EditVenteDialog";
import type { PdfBranding } from "@/lib/pdf-branding";
import type { PaginatedResult } from "@/lib/pagination";

const TOUS = "tous";

/**
 * Colonnes triables. `montantRestant` en est exclu : il vaut
 * `montant − Σ encaissements`, calculé après lecture, donc aucun `ORDER BY` ne
 * lui correspond. Les clés doivent correspondre aux `id` réels des colonnes,
 * sinon l'en-tête n'est jamais cliquable.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    Client: "Client",
    quantite: "quantite",
    prixUnitaire: "prixUnitaire",
    montant: "montant",
    statut: "statut",
    createdAt: "createdAt",
};

export interface ClientOption {
    id: string;
    nom: string;
}

export function VentesTableServer({
    resultat,
    clients,
    branding,
    saisonActive,
}: {
    resultat: PaginatedResult<Vente>;
    /**
     * Clients venus du serveur, et non déduits des lignes affichées : une page
     * n'en contient qu'une tranche, le menu serait amputé et changerait à chaque
     * changement de page.
     */
    clients: ClientOption[];
    branding: PdfBranding;
    saisonActive?: SaisonActive;
}) {
    const { t } = useClientTranslations();
    const { setParams } = useTableQueryState();
    const searchParams = useSearchParams();
    const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const { exporter, enCours } = useExportFiltre<Vente>(getVentesExportAction);

    const columns = createVentesColumns(
        t,
        (vente) => {
            setSelectedVente(vente);
            setEditDialogOpen(true);
        },
        branding,
        saisonActive
    );

    // Les filtres vivent dans l'URL et sont appliqués en base. `useSearchParams`
    // et non `window.location` : ce dernier ne provoque aucun re-rendu.
    const clientId = searchParams.get("clientId") ?? TOUS;
    const statut = searchParams.get("statut") ?? TOUS;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const dateRange: DateRange | undefined = from
        ? { from: new Date(from), to: to ? new Date(to) : undefined }
        : undefined;

    const filtresActifs = clientId !== TOUS || statut !== TOUS || !!from;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-3 px-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("finance.ventes.client")}
                    </label>
                    <Select
                        value={clientId}
                        onValueChange={(v) => setParams({ clientId: v === TOUS ? "" : v })}
                    >
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                            {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="min-w-0 xl:min-w-45">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("finance.paiements.statut")}
                    </label>
                    <Select
                        value={statut}
                        onValueChange={(v) => setParams({ statut: v === TOUS ? "" : v })}
                    >
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                            <SelectItem value="EN_ATTENTE">
                                {t("finance.paiements.statutEnAttente")}
                            </SelectItem>
                            <SelectItem value="PARTIEL">{t("finance.paiements.statutPartiel")}</SelectItem>
                            <SelectItem value="PAYE">{t("finance.paiements.statutPaye")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="min-w-0">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">{t("bonAchat.periode")}</label>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(plage) =>
                            setParams({
                                from: plage?.from ? plage.from.toISOString().slice(0, 10) : "",
                                to: plage?.to ? plage.to.toISOString().slice(0, 10) : "",
                            })
                        }
                        placeholder={t("bonAchat.periode")}
                    />
                </div>

                {filtresActifs && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setParams({ clientId: "", statut: "", from: "", to: "" })}
                        className="gap-1.5 text-[#3D1C00]/70"
                    >
                        <X className="h-3.5 w-3.5" />
                        {t("common.resetFilters")}
                    </Button>
                )}
            </div>

            <DataTableServer
                columns={columns}
                result={resultat}
                sortableColumns={COLONNES_TRIABLES}
                searchPlaceholder={t("finance.ventes.searchPlaceholder")}
                toolbar={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() =>
                                void exporter((lignes) => exportVentesToPDF(lignes, branding))
                            }
                            className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                        >
                            {enCours ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4" />
                            )}
                            {t("common.exportPDF")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() => void exporter((lignes) => exportVentesToExcel(lignes))}
                            className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            {t("common.exportExcel")}
                        </Button>
                    </>
                }
            />

            <EditVenteDialog
                vente={selectedVente}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
            />
        </div>
    );
}
