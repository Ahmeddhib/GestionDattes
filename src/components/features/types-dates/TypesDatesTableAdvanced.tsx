"use client";

import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createTypesDatesColumns, type TypeDate } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface TypesDatesTableAdvancedProps {
    typesDates: TypeDate[];
}

export function TypesDatesTableAdvanced({ typesDates }: TypesDatesTableAdvancedProps) {
    const { t } = useClientTranslations();

    const columns = createTypesDatesColumns(
        (typeDate) => {
            // The dialog component handles its own open state
            // Render will happen through the columns action button
        },
        (typeDate) => {
            // The dialog component handles its own open state
            // Render will happen through the columns action button
        },
        t
    );

    return (
        <DataTableAdvanced
            columns={columns}
            data={typesDates}
            searchKey="nom"
            searchPlaceholder={t("typesDates.searchPlaceholder")}
            enableRowSelection={true}
            enableDragDrop={false}
        />
    );
}
