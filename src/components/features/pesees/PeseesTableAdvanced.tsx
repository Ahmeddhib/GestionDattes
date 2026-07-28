"use client";

import { useMemo } from "react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createColumns, groupPeseesByLivraison, type Pesee } from "./columns";

interface PeseesTableAdvancedProps {
    data: Pesee[];
}

export function PeseesTableAdvanced({ data }: PeseesTableAdvancedProps) {
    const { t } = useClientTranslations();
    const columns = createColumns(t);
    const groupedData = useMemo(() => groupPeseesByLivraison(data), [data]);

    return (
        <DataTableAdvanced
            columns={columns}
            data={groupedData}
            searchKey="numeroLot"
            searchPlaceholder={t("pesees.searchPlaceholder")}
        />
    );
}
