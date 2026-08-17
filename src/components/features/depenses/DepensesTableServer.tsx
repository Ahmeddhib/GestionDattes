"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableServer } from "@/components/ui/data-table-server";
import { Button } from "@/components/ui/button";
import { exportDepensesToPDF, exportDepensesToExcel } from "@/lib/export-utils";
import { createDepensesColumns, type Depense } from "./columns";
import { UpdateDepenseDialog } from "./UpdateDepenseDialog";
import { DeleteDepenseDialog } from "./DeleteDepenseDialog";
import { getDepensesExportAction } from "@/actions/depenses/get-depenses-export.action";
import { useExportFiltre } from "@/hooks/useExportFiltre";
import type { PaginatedResult } from "@/lib/pagination";
import type { PdfBranding } from "@/lib/pdf-branding";

/**
 * Colonnes triables. `observations` et l'auteur n'y figurent pas : trier du
 * texte libre non indexé ferait trier la table entière en mémoire côté base.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    libelle: "libelle",
    montant: "montant",
    categorie: "categorie",
    dateDepense: "dateDepense",
};

export function DepensesTableServer({
    resultat,
    branding,
}: {
    resultat: PaginatedResult<Depense>;
    branding: PdfBranding;
}) {
    const { t } = useClientTranslations();
    const [selectedDepense, setSelectedDepense] = useState<Depense | null>(null);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const { exporter, enCours } = useExportFiltre<Depense>(getDepensesExportAction);

    const columns = createDepensesColumns(
        t,
        (depense) => {
            setSelectedDepense(depense);
            setUpdateDialogOpen(true);
        },
        (depense) => {
            setSelectedDepense(depense);
            setDeleteDialogOpen(true);
        }
    );

    return (
        <>
            <DataTableServer
                columns={columns}
                result={resultat}
                sortableColumns={COLONNES_TRIABLES}
                searchPlaceholder={t("finance.depenses.searchPlaceholder")}
                toolbar={
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() =>
                                void exporter((lignes) => exportDepensesToPDF(lignes, branding))
                            }
                            className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                        >
                            {enCours ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FileDown className="mr-2 h-4 w-4" />
                            )}
                            {t("common.exportPDF")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={enCours}
                            onClick={() => void exporter((lignes) => exportDepensesToExcel(lignes))}
                            className="rounded-md border-[#C17A2B]/40 hover:bg-[#FAF0DC]"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            {t("common.exportExcel")}
                        </Button>
                    </>
                }
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
