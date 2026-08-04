"use client";

import { useState } from "react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createSaisonsColumns, type Saison } from "./columns";
import { UpdateSaisonDialog } from "./UpdateSaisonDialog";
import { DeleteSaisonDialog } from "./DeleteSaisonDialog";

interface SaisonsTableAdvancedProps {
    data: Saison[];
}

export function SaisonsTableAdvanced({ data }: SaisonsTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedSaison, setSelectedSaison] = useState<Saison | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleEdit = (saison: Saison) => {
        setSelectedSaison(saison);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (saison: Saison) => {
        setSelectedSaison(saison);
        setDeleteDialogOpen(true);
    };

    const columns = createSaisonsColumns(t, handleEdit, handleDelete);

    return (
        <>
            <DataTableAdvanced
                columns={columns}
                data={data}
                searchKey="nom"
                searchPlaceholder={t("finance.saisons.searchPlaceholder")}
            />

            <UpdateSaisonDialog
                saison={selectedSaison}
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
            />

            <DeleteSaisonDialog
                saison={selectedSaison}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
