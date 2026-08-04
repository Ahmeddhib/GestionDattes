"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit, Trash2 } from "lucide-react";

export type Saison = {
    id: string;
    nom: string;
    dateDebut: Date;
    dateFin: Date;
    active: boolean;
    createdAt: Date;
    _count?: {
        Vente: number;
    };
};

export const createSaisonsColumns = (
    t: (key: string) => string,
    onEdit: (saison: Saison) => void,
    onDelete: (saison: Saison) => void
): ColumnDef<Saison>[] => [
    {
        accessorKey: "nom",
        header: t("finance.saisons.nom"),
        cell: ({ row }) => (
            <div className="font-medium text-[#3D1C00]">{row.getValue("nom")}</div>
        ),
    },
    {
        accessorKey: "dateDebut",
        header: t("finance.saisons.dateDebut"),
        cell: ({ row }) => (
            <span className="text-sm text-gray-600">
                {format(new Date(row.getValue("dateDebut")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        accessorKey: "dateFin",
        header: t("finance.saisons.dateFin"),
        cell: ({ row }) => (
            <span className="text-sm text-gray-600">
                {format(new Date(row.getValue("dateFin")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        accessorKey: "active",
        header: t("finance.saisons.active"),
        cell: ({ row }) => {
            const active = row.getValue<boolean>("active");
            return (
                <Badge
                    variant={active ? "default" : "secondary"}
                    className={active ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {active ? t("common.actif") : t("common.inactif")}
                </Badge>
            );
        },
    },
    {
        accessorKey: "_count.Vente",
        header: t("finance.ventes.title"),
        cell: ({ row }) => {
            const count = row.original._count?.Vente || 0;
            return (
                <Badge
                    variant={count > 0 ? "default" : "secondary"}
                    className={count > 0 ? "bg-[#C17A2B] hover:bg-[#A0621F]" : ""}
                >
                    {count}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
            const saison = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(saison)}
                        className="h-8 w-8 p-0 hover:bg-[#FAF0DC]"
                    >
                        <Edit className="h-4 w-4 text-[#C17A2B]" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(saison)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            );
        },
    },
];
