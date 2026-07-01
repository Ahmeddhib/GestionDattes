"use client";

import { useState } from "react";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { createRegionsColumns, type Region } from "./columns";
import { UpdateRegionDialog } from "./UpdateRegionDialog";
import { DeleteRegionDialog } from "./DeleteRegionDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface RegionsTableAdvancedProps {
    initialData: Region[];
}

export function RegionsTableAdvanced({ initialData }: RegionsTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleUpdate = (region: Region) => {
        setSelectedRegion(region);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (region: Region) => {
        setSelectedRegion(region);
        setDeleteDialogOpen(true);
    };

    const columns = createRegionsColumns(handleUpdate, handleDelete, t);

    return (
        <>
            <DataTableAdvanced
                columns={columns}
                data={initialData}
                searchKey="nom"
                searchPlaceholder={t("regions.searchPlaceholder")}
                enableRowSelection={true}
                enableDragDrop={false}
            />

            {selectedRegion && (
                <>
                    <UpdateRegionDialog
                        region={selectedRegion}
                        open={updateDialogOpen}
                        onOpenChange={setUpdateDialogOpen}
                    />
                    <DeleteRegionDialog
                        region={selectedRegion}
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                    />
                </>
            )}
        </>
    );
}
