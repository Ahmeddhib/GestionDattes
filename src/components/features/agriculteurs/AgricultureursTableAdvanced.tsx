"use client";

import { useState } from "react";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createAgricultureursColumns, type Agriculteur } from "./columns";
import { UpdateAgriculteurDialog } from "./UpdateAgriculteurDialog";
import { DeleteAgriculteurDialog } from "./DeleteAgriculteurDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface AgricultureursTableAdvancedProps {
    initialData: Agriculteur[];
    regions: Region[];
}

export function AgricultureursTableAdvanced({
    initialData,
    regions,
}: AgricultureursTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedAgriculteur, setSelectedAgriculteur] = useState<Agriculteur | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleUpdate = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (agriculteur: Agriculteur) => {
        setSelectedAgriculteur(agriculteur);
        setDeleteDialogOpen(true);
    };

    const columns = createAgricultureursColumns(handleUpdate, handleDelete, t);

    return (
        <>
            <DataTableAdvanced
                columns={columns}
                data={initialData}
                searchKey="code"
                searchPlaceholder={t("agriculteurs.searchPlaceholder")}
                enableRowSelection={true}
                enableDragDrop={false}
            />

            {selectedAgriculteur && (
                <>
                    <UpdateAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        regions={regions}
                        open={updateDialogOpen}
                        onOpenChange={setUpdateDialogOpen}
                    />
                    <DeleteAgriculteurDialog
                        agriculteur={selectedAgriculteur}
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
