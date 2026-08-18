"use client";

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
import {
    exportPaiementsAgriculteursToPDF,
    exportPaiementsAgriculteursToExcel,
} from "@/lib/export-utils";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import { useExportFiltre } from "@/hooks/useExportFiltre";
import { getPaiementsAgriculteursExportAction } from "@/actions/paiements-agriculteurs/get-paiements-page.action";
import { createPaiementsColumns, type BonAchatAvecSolde } from "./columns";
import type { PdfBranding } from "@/lib/pdf-branding";
import type { SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import type { PaginatedResult } from "@/lib/pagination";

const TOUS = "tous";

/**
 * Colonnes triables, par identifiant de colonne.
 *
 * `montantPaye` et `montantRestant` en sont exclus : ce sont
 * `Σ paiements` et `montant − Σ paiements`, calculés après lecture. Aucun
 * `ORDER BY` ne les exprime, et les rendre cliquables trierait sur autre chose
 * que ce que la colonne affiche.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    numero: "numero",
    agriculteur: "agriculteur",
    montant: "montant",
    statut: "statut",
    createdAt: "createdAt",
};

export interface AgriculteurOptionPaiement {
    id: string;
    nom: string;
    prenom: string;
    code: string;
}

export function PaiementsAgriculteursTableServer({
    resultat,
    agriculteurs,
    branding,
    saisonActive,
}: {
    resultat: PaginatedResult<BonAchatAvecSolde>;
    /**
     * Liste venue du serveur, et non déduite des lignes affichées : une page
     * n'en contient qu'une tranche, le menu serait amputé et changerait à chaque
     * changement de page.
     */
    agriculteurs: AgriculteurOptionPaiement[];
    branding: PdfBranding;
    saisonActive?: SaisonActive;
}) {
    const { t } = useClientTranslations();
    const { setParams } = useTableQueryState();
    const searchParams = useSearchParams();
    const columns = createPaiementsColumns(t, saisonActive);

    const { exporter, enCours } = useExportFiltre<BonAchatAvecSolde>(
        getPaiementsAgriculteursExportAction
    );

    // Les filtres vivent dans l'URL et s'appliquent en base. `useSearchParams` et
    // non `window.location` : ce dernier ne déclenche aucun re-rendu.
    const agriculteurId = searchParams.get("agriculteurId") ?? TOUS;
    const statut = searchParams.get("statut") ?? TOUS;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const dateRange: DateRange | undefined = from
        ? { from: new Date(from), to: to ? new Date(to) : undefined }
        : undefined;

    const filtresActifs = agriculteurId !== TOUS || statut !== TOUS || !!from;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-3 px-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-[#3D1C00]/60">
                        {t("livraisons.agriculteur")}
                    </label>
                    <Select
                        value={agriculteurId}
                        onValueChange={(v) => setParams({ agriculteurId: v === TOUS ? "" : v })}
                    >
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                            {agriculteurs.map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                    {a.nom} {a.prenom} ({a.code})
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
                        onClick={() => setParams({ agriculteurId: "", statut: "", from: "", to: "" })}
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
                searchPlaceholder={t("bonAchat.searchPlaceholder")}
                toolbar={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() =>
                                void exporter((lignes) =>
                                    exportPaiementsAgriculteursToPDF(lignes, branding)
                                )
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
                            onClick={() =>
                                void exporter((lignes) => exportPaiementsAgriculteursToExcel(lignes))
                            }
                            className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            {t("common.exportExcel")}
                        </Button>
                    </>
                }
            />
        </div>
    );
}
