"use client";

import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createTypesCaissesColumns, type TypeCaisse } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface TypesCaissesTableAdvancedProps {
    typesCaisses: TypeCaisse[];
}

export function TypesCaissesTableAdvanced({ typesCaisses }: TypesCaissesTableAdvancedProps) {
    const { t } = useClientTranslations();

    const columns = createTypesCaissesColumns(t);

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
