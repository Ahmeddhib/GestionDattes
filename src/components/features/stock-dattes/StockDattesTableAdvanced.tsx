"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createStockDattesColumns, type StockDateGroupe } from "./columns";

interface StockDattesTableAdvancedProps {
    data: StockDateGroupe[];
    /** Saison résolue côté serveur, propagée au détail des lots. */
    saisonId?: string;
}

/**
 * Tableau resté côté client, à la différence des autres modules.
 *
 * Une ligne = un type de datte, et cet ensemble est borné par la table de
 * référence `TypeDate`, pas par le volume d'activité : quatre lignes ici pour
 * trente lots. Le jeu affiché est donc complet, ce qui rend la recherche et le
 * tri locaux exacts — alors qu'ailleurs ils ne porteraient que sur une page.
 * Le coût réel de ce module était la lecture des lots, traitée en base par
 * `findGroupesParType` et par le chargement à la demande du détail.
 */
export function StockDattesTableAdvanced({ data, saisonId }: StockDattesTableAdvancedProps) {
    const { t } = useClientTranslations();
    const columns = createStockDattesColumns(t, saisonId);

    return (
        <DataTableAdvanced
            columns={columns}
            data={data}
            searchKey="typeDate"
            searchPlaceholder={t("stockDattes.searchPlaceholder")}
        />
    );
}
