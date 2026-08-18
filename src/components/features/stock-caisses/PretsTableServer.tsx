"use client";

import { useSearchParams } from "next/navigation";
import { FileDown, FileSpreadsheet, Loader2, X } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableServer } from "@/components/ui/data-table-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { exportPretsToPDF, exportPretsToExcel } from "@/lib/export-utils";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import { useExportFiltre } from "@/hooks/useExportFiltre";
import { getPretsExportAction } from "@/actions/prets-caisses/get-prets-page.action";
import { createPretsColumns, type PretCaisse } from "./columns";
import type { PdfBranding } from "@/lib/pdf-branding";
import type { PaginatedResult } from "@/lib/pagination";

const TOUS = "tous";

/**
 * Colonnes triables. `nombreRestant` en est exclu : il vaut
 * `nombrePrete − nombreRetourne`, calculé après lecture, donc aucun `ORDER BY`
 * ne lui correspond. Les clés doivent correspondre aux `id` réels des colonnes,
 * sinon l'en-tête n'est jamais cliquable.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    agriculteur: "agriculteur",
    typeCaisse: "typeCaisse",
    nombrePrete: "nombrePrete",
    nombreRetourne: "nombreRetourne",
    statut: "statut",
    datePreT: "datePreT",
};

export interface OptionsFiltresPrets {
    agriculteurs: { id: string; nom: string; prenom: string; code: string }[];
    typesCaisses: { id: string; nom: string }[];
}

export function PretsTableServer({
    resultat,
    agriculteurs,
    typesCaisses,
    branding,
}: {
    resultat: PaginatedResult<PretCaisse>;
    /**
     * Options venues du serveur, et non déduites des lignes affichées : une page
     * n'en contient qu'une tranche, les menus seraient amputés et changeraient à
     * chaque changement de page.
     */
    agriculteurs: OptionsFiltresPrets["agriculteurs"];
    typesCaisses: OptionsFiltresPrets["typesCaisses"];
    branding: PdfBranding;
}) {
    const { t } = useClientTranslations();
    const { setParams } = useTableQueryState();
    const searchParams = useSearchParams();
    const columns = createPretsColumns(t);

    const { exporter, enCours } = useExportFiltre<PretCaisse>(getPretsExportAction);

    // Les filtres vivent dans l'URL et s'appliquent en base.
    const agriculteurId = searchParams.get("agriculteurId") ?? TOUS;
    const typeCaisseId = searchParams.get("typeCaisseId") ?? TOUS;
    // `statut` absent vaut EN_COURS : c'était le défaut du tableau, la page
    // s'ouvre donc toujours sur les prêts encore dehors.
    const statut = searchParams.get("statut") ?? "EN_COURS";
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";

    const filtresActifs =
        agriculteurId !== TOUS || typeCaisseId !== TOUS || statut !== "EN_COURS" || !!from || !!to;

    return (
        <div className="rounded-lg bg-card p-4 shadow-sm border border-border md:p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
                {t("pretsCaisses.pretsCaisses")} ({resultat.totalItems})
            </h2>

            <div className="mb-4 space-y-3 rounded-md border border-border bg-muted/50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            {t("livraisons.agriculteur")}
                        </label>
                        <Select
                            value={agriculteurId}
                            onValueChange={(v) => setParams({ agriculteurId: v === TOUS ? "" : v })}
                        >
                            <SelectTrigger className="rounded-sm border-border bg-card">
                                <SelectValue placeholder={t("pretsCaisses.filterAgriculteur")} />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                                {agriculteurs.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.nom} {a.prenom} ({a.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            {t("pretsCaisses.typeCaisse")}
                        </label>
                        <Select
                            value={typeCaisseId}
                            onValueChange={(v) => setParams({ typeCaisseId: v === TOUS ? "" : v })}
                        >
                            <SelectTrigger className="rounded-sm border-border bg-card">
                                <SelectValue placeholder={t("pretsCaisses.filterTypeCaisse")} />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                                {typesCaisses.map((tc) => (
                                    <SelectItem key={tc.id} value={tc.id}>
                                        {tc.nom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            {t("pretsCaisses.statut")}
                        </label>
                        <Select value={statut} onValueChange={(v) => setParams({ statut: v })}>
                            <SelectTrigger className="rounded-sm border-border bg-card">
                                <SelectValue placeholder={t("pretsCaisses.filterStatut")} />
                            </SelectTrigger>
                            <SelectContent className="bg-card">
                                <SelectItem value={TOUS}>{t("common.all")}</SelectItem>
                                <SelectItem value="EN_COURS">{t("pretsCaisses.enCours")}</SelectItem>
                                <SelectItem value="RETOURNE">{t("pretsCaisses.retourne")}</SelectItem>
                                <SelectItem value="INCOMPLET">{t("pretsCaisses.incomplet")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            {t("common.dateDebut")}
                        </label>
                        <Input
                            type="date"
                            value={from}
                            onChange={(e) => setParams({ from: e.target.value })}
                            className="rounded-sm border-border bg-card"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                            {t("common.dateFin")}
                        </label>
                        <Input
                            type="date"
                            value={to}
                            onChange={(e) => setParams({ to: e.target.value })}
                            className="rounded-sm border-border bg-card"
                        />
                    </div>

                    {filtresActifs && (
                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setParams({
                                        agriculteurId: "",
                                        typeCaisseId: "",
                                        statut: "EN_COURS",
                                        from: "",
                                        to: "",
                                    })
                                }
                                className="rounded-md border-border hover:bg-card"
                            >
                                <X className="mr-2 h-4 w-4" />
                                {t("common.resetFilters")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <DataTableServer
                columns={columns}
                result={resultat}
                sortableColumns={COLONNES_TRIABLES}
                searchPlaceholder={t("common.search")}
                toolbar={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() => void exporter((lignes) => exportPretsToPDF(lignes, branding))}
                            className="rounded-md border-border hover:bg-muted"
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
                            onClick={() => void exporter((lignes) => exportPretsToExcel(lignes))}
                            className="rounded-md border-border hover:bg-muted"
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
