"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export type Client = {
    id: string;
    nom: string;
    telephone: string | null;
    adresse: string | null;
    email: string | null;
    createdAt: Date;
    _count?: {
        Vente: number;
    };
};

export const createColumns = (
    t: (key: string) => string,
    onEdit: (client: Client) => void,
    onDelete: (client: Client) => void
): ColumnDef<Client>[] => [
        {
            accessorKey: "nom",
            header: t("clients.nom"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">
                    {row.getValue("nom")}
                </div>
            ),
        },
        {
            accessorKey: "telephone",
            header: t("clients.telephone"),
            cell: ({ row }) => {
                const telephone = row.getValue("telephone") as string | null;
                return telephone || <span className="text-gray-400">—</span>;
            },
        },
        {
            accessorKey: "email",
            header: t("clients.email"),
            cell: ({ row }) => {
                const email = row.getValue("email") as string | null;
                return email || <span className="text-gray-400">—</span>;
            },
        },
        {
            accessorKey: "adresse",
            header: t("clients.adresse"),
            cell: ({ row }) => {
                const adresse = row.getValue("adresse") as string | null;
                return adresse ? (
                    <span className="text-sm">{adresse}</span>
                ) : (
                    <span className="text-gray-400">—</span>
                );
            },
        },
        {
            accessorKey: "_count.Vente",
            header: t("clients.nbVentes"),
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
                const client = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(client)}
                            className="h-8 w-8 p-0 hover:bg-[#FAF0DC]"
                        >
                            <Edit className="h-4 w-4 text-[#C17A2B]" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(client)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                );
            },
        },
    ];
