"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createStockDattesColumns, type StockDateGroupe } from "./columns";

interface StockDattesTableAdvancedProps {
    data: StockDateGroupe[];
}

export function StockDattesTableAdvanced({ data }: StockDattesTableAdvancedProps) {
    const { t } = useClientTranslations();
    const columns = createStockDattesColumns(t);

    return (
        <DataTableAdvanced
            columns={columns}
            data={data}
            searchKey="typeDate"
            searchPlaceholder={t("stockDattes.searchPlaceholder")}
        />
    );
}
