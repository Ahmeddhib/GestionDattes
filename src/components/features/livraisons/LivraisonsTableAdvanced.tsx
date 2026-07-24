"use client";

import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createLivraisonsColumns, type Livraison } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface LivraisonsTableAdvancedProps {
    livraisons: Livraison[];
    canEditAcceptedQuantity: boolean;
}

export function LivraisonsTableAdvanced({ livraisons, canEditAcceptedQuantity }: LivraisonsTableAdvancedProps) {
    const { t } = useClientTranslations();

    const columns = createLivraisonsColumns(
        (livraison) => {
            // Dialog handles its own state
        },
        (livraison) => {
            // Dialog handles its own state
        },
        t,
        canEditAcceptedQuantity
    );

    return (
        <DataTableAdvanced
            columns={columns}
            data={livraisons}
            searchKey="numeroLot"
            searchPlaceholder={t("livraisons.searchPlaceholder")}
            enableRowSelection={true}
            enableDragDrop={false}
        />
    );
}
