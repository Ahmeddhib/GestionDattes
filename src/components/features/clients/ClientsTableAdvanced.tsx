"use client";

import { useState } from "react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createColumns, type Client } from "./columns";
import { UpdateClientDialog } from "./UpdateClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";

interface ClientsTableAdvancedProps {
    data: Client[];
}

export function ClientsTableAdvanced({ data }: ClientsTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (client: Client) => {
        setSelectedClient(client);
        setDeleteDialogOpen(true);
    };

    const columns = createColumns(t, handleEdit, handleDelete);

    return (
        <>
            <DataTableAdvanced
                columns={columns}
                data={data}
                searchKey="nom"
                searchPlaceholder={t("clients.searchPlaceholder")}
            />

            <UpdateClientDialog
                client={selectedClient}
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
            />

            <DeleteClientDialog
                client={selectedClient}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
