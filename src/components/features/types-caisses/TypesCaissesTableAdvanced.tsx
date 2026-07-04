"use client";

import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createTypesCaissesColumns, type TypeCaisse } from "./columns";
import { UpdateTypeCaisseDialog } from "./UpdateTypeCaisseDialog";
import { DeleteTypeCaisseDialog } from "./DeleteTypeCaisseDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface TypesCaissesTableAdvancedProps {
    typesCaisses: TypeCaisse[];
}

export function TypesCaissesTableAdvanced({ typesCaisses }: TypesCaissesTableAdvancedProps) {
    const { t } = useClientTranslations();

    const columns = createTypesCaissesColumns(
        (typeCaisse) => {
            // The dialog component handles its own open state
            // Render will happen through the columns action button
        },
        (typeCaisse) => {
            // The dialog component handles its own open state
            // Render will happen through the columns action button
        },
        t
    );

    return (
        <DataTableAdvanced
            columns={columns}
            data={typesCaisses}
            searchKey="nom"
            searchPlaceholder={t("typesCaisses.searchPlaceholder")}
            enableRowSelection={true}
            enableDragDrop={false}
        />
    );
}
