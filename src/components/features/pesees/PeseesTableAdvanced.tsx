"use client";

import { useState } from "react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createColumns, type Pesee } from "./columns";
import { UpdatePeseeDialog } from "./UpdatePeseeDialog";
import { DeletePeseeDialog } from "./DeletePeseeDialog";

interface PeseesTableAdvancedProps {
    data: Pesee[];
}

export function PeseesTableAdvanced({ data }: PeseesTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedPesee, setSelectedPesee] = useState<Pesee | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleEdit = (pesee: Pesee) => {
        setSelectedPesee(pesee);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (pesee: Pesee) => {
        setSelectedPesee(pesee);
        setDeleteDialogOpen(true);
    };

    const columns = createColumns(t, handleEdit, handleDelete);

    return (
        <>
            <DataTableAdvanced
                columns={columns}
                data={data}
                searchPlaceholder={t("pesees.searchPlaceholder")}
            />

            <UpdatePeseeDialog
                pesee={selectedPesee}
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
            />

            <DeletePeseeDialog
                pesee={selectedPesee}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
