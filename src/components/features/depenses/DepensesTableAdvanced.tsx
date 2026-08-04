"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableAdvanced } from "@/components/ui/data-table-advanced";
import { Button } from "@/components/ui/button";
import { exportDepensesToPDF, exportDepensesToExcel } from "@/lib/export-utils";
import { createDepensesColumns, type Depense } from "./columns";
import { UpdateDepenseDialog } from "./UpdateDepenseDialog";
import { DeleteDepenseDialog } from "./DeleteDepenseDialog";

interface DepensesTableAdvancedProps {
    data: Depense[];
}

export function DepensesTableAdvanced({ data }: DepensesTableAdvancedProps) {
    const { t } = useClientTranslations();
    const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleEdit = (depense: Depense) => {
        setSelectedDepense(depense);
        setUpdateDialogOpen(true);
    };

    const handleDelete = (depense: Depense) => {
        setSelectedDepense(depense);
        setDeleteDialogOpen(true);
    };

    const columns = createDepensesColumns(t, handleEdit, handleDelete);

    return (
        <>
            <div className="flex justify-end gap-2 p-4 pb-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDepensesToPDF(data)}
                    className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    {t("common.exportPDF")}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportDepensesToExcel(data)}
                    className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    {t("common.exportExcel")}
                </Button>
            </div>
            <DataTableAdvanced
                columns={columns}
                data={data}
                searchKey="libelle"
                searchPlaceholder={t("finance.depenses.searchPlaceholder")}
            />

            <UpdateDepenseDialog
                depense={selectedDepense}
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
            />

            <DeleteDepenseDialog
                depense={selectedDepense}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
