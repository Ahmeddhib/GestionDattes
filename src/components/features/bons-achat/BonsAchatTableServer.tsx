"use client";

import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableServer } from "@/components/ui/data-table-server";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import { createBonsAchatColumns, type BonAchat } from "./columns";
import type { PaginatedResult } from "@/lib/pagination";

const TOUS = "tous";

/**
 * Colonnes triables. Les colonnes dérivées à l'affichage (montant payé, reste
 * à payer, détail des pesées) en sont exclues : aucun `ORDER BY` ne leur
 * correspond, et les rendre cliquables donnerait un tri faux sans le dire.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    numero: "numero",
    montant: "montant",
    prixKg: "prixKg",
    statut: "statut",
    createdAt: "createdAt",
};

export interface AgriculteurOption {
    id: string;
    nom: string;
    prenom: string;
    code: string;
}

export function BonsAchatTableServer({
    resultat,
    agriculteurs,
    tenant,
}: {
    resultat: PaginatedResult<BonAchat>;
    /**
     * Liste complète venue du serveur, et non déduite des lignes affichées :
     * une page ne contient qu'une tranche, le menu serait amputé et changerait
     * à chaque page.
     */
    agriculteurs: AgriculteurOption[];
    tenant: { name: string; address: string | null; phone: string | null; email: string | null };
}) {
    const { t } = useClientTranslations();
    const { setParams } = useTableQueryState();
    const searchParams = useSearchParams();
    const columns = createBonsAchatColumns(t, tenant);

    // Les filtres vivent dans l'URL : ils sont appliqués en base, pas sur le
    // tableau chargé. `useSearchParams` et non `window.location` — ce dernier
    // ne provoque aucun re-rendu quand l'URL change.
    const agriculteurId = searchParams.get("agriculteurId") ?? TOUS;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const dateRange: DateRange | undefined = from
        ? { from: new Date(from), to: to ? new Date(to) : undefined }
        : undefined;

    const filtresActifs = agriculteurId !== TOUS || !!from;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 items-end gap-3 px-1 sm:grid-cols-2 xl:flex xl:flex-wrap">
                <div className="min-w-0 xl:min-w-55">
                    <label className="mb-1 block text-xs text-muted-foreground">
                        {t("livraisons.agriculteur")}
                    </label>
                    <Select
                        value={agriculteurId}
                        onValueChange={(v) => setParams({ agriculteurId: v === TOUS ? "" : v })}
                    >
                        <SelectTrigger className="w-full rounded-sm border-border">
                            <SelectValue />
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

                <div className="min-w-0">
                    <label className="mb-1 block text-xs text-muted-foreground">
                        {t("bonAchat.periode")}
                    </label>
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
                        onClick={() => setParams({ agriculteurId: "", from: "", to: "" })}
                        className="gap-1.5 text-muted-foreground"
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
            />
        </div>
    );
}
