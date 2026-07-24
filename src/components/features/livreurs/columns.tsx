"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export type Livreur = {
    id: string;
    nom: string;
    telephone: string | null;
    cin: string | null;
    vehicule: string | null;
    active: boolean;
    createdAt: Date;
};

export const createLivreurColumns = (
    t: (key: string) => string,
    onEdit: (livreur: Livreur) => void,
    onDelete: (livreur: Livreur) => void,
): ColumnDef<Livreur>[] => [
    { accessorKey: "nom", header: t("livreurs.nom"), cell: ({ row }) => <span className="font-medium text-[#3D1C00]">{row.original.nom}</span> },
    { accessorKey: "telephone", header: t("livreurs.telephone"), cell: ({ row }) => row.original.telephone || "—" },
    { accessorKey: "cin", header: t("livreurs.cin"), cell: ({ row }) => row.original.cin || "—" },
    { accessorKey: "vehicule", header: t("livreurs.vehicule"), cell: ({ row }) => row.original.vehicule || "—" },
    {
        accessorKey: "active",
        header: t("livreurs.status"),
        cell: ({ row }) => <Badge className={row.original.active ? "bg-green-600" : "bg-gray-500"}>{row.original.active ? t("livreurs.active") : t("livreurs.inactive")}</Badge>,
    },
    {
        id: "actions", header: t("common.actions"), cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(row.original)}><Edit className="h-4 w-4 text-[#C17A2B]" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDelete(row.original)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
            </div>
        ),
    },
];
