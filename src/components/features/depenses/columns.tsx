"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";

export type Depense = {
    id: string;
    libelle: string;
    montant: number;
    categorie: string | null;
    dateDepense: Date;
    observations: string | null;
    User: { id: string; name: string };
};

export const createDepensesColumns = (
    t: (key: string) => string,
    onEdit: (depense: Depense) => void,
    onDelete: (depense: Depense) => void
): ColumnDef<Depense>[] => [
    {
        accessorKey: "libelle",
        header: t("finance.depenses.libelle"),
        cell: ({ row }) => (
            <div className="font-medium text-foreground">{row.getValue("libelle")}</div>
        ),
    },
    {
        accessorKey: "categorie",
        header: t("finance.depenses.categorie"),
        cell: ({ row }) => {
            const categorie = row.getValue<string | null>("categorie");
            return categorie ? (
                <Badge variant="outline" className="bg-muted text-foreground border-border">
                    {categorie}
                </Badge>
            ) : (
                <span className="text-gray-400">—</span>
            );
        },
    },
    {
        accessorKey: "montant",
        header: t("finance.depenses.montant"),
        cell: ({ row }) => (
            <div className="text-right font-bold text-red-600">
                {row.getValue<number>("montant").toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: "dateDepense",
        // Idem : la colonne porte la date de la dépense, pas une date de pesée.
        header: t("finance.depenses.dateDepense"),
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {format(new Date(row.getValue<Date>("dateDepense")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        accessorKey: "observations",
        header: t("bonAchat.observations"),
        cell: ({ row }) => {
            const observations = row.getValue<string | null>("observations");
            return observations ? (
                <span className="text-sm text-muted-foreground line-clamp-2 max-w-55">{observations}</span>
            ) : (
                <span className="text-muted-foreground">—</span>
            );
        },
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
            const depense = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(depense)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                    >
                        <Edit className="h-4 w-4 text-[#C17A2B]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(depense)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            );
        },
    },
];
