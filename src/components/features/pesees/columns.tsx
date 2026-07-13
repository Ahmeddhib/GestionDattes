"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type Pesee = {
    id: string;
    poidsBrut: number;
    poidsNet: number;
    tare: number | null;
    createdAt: Date;
    Livraison: {
        id: string;
        numeroLot: string;
        dateLivraison: Date;
        Agriculteur: {
            id: string;
            code: string;
            nom: string;
            prenom: string;
        };
        TypeDate: {
            id: string;
            nom: string;
        };
    };
};

export const createColumns = (
    t: (key: string) => string,
    onEdit: (pesee: Pesee) => void,
    onDelete: (pesee: Pesee) => void
): ColumnDef<Pesee>[] => [
        {
            accessorKey: "Livraison.numeroLot",
            header: t("pesees.numeroLot"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">
                    {row.original.Livraison.numeroLot}
                </div>
            ),
        },
        {
            accessorKey: "Livraison.Agriculteur",
            header: t("pesees.agriculteur"),
            cell: ({ row }) => {
                const agriculteur = row.original.Livraison.Agriculteur;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-[#3D1C00]">
                            {agriculteur.nom} {agriculteur.prenom}
                        </span>
                        <span className="text-xs text-gray-500">
                            {agriculteur.code}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "Livraison.TypeDate.nom",
            header: t("pesees.typeDate"),
            cell: ({ row }) => (
                <Badge variant="outline" className="border-[#C17A2B] text-[#C17A2B]">
                    {row.original.Livraison.TypeDate.nom}
                </Badge>
            ),
        },
        {
            accessorKey: "poidsBrut",
            header: t("pesees.poidsBrut"),
            cell: ({ row }) => (
                <div className="text-right font-medium">
                    {row.getValue<number>("poidsBrut").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "tare",
            header: t("pesees.tare"),
            cell: ({ row }) => {
                const tare = row.getValue<number | null>("tare");
                return (
                    <div className="text-right">
                        {tare !== null ? `${tare.toFixed(2)} kg` : <span className="text-gray-400">—</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "poidsNet",
            header: t("pesees.poidsNet"),
            cell: ({ row }) => (
                <div className="text-right font-bold text-[#C17A2B]">
                    {row.getValue<number>("poidsNet").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "createdAt",
            header: t("pesees.datePesee"),
            cell: ({ row }) => {
                const date = row.getValue<Date>("createdAt");
                return (
                    <span className="text-sm text-gray-600">
                        {format(new Date(date), "dd MMM yyyy HH:mm", { locale: fr })}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const pesee = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(pesee)}
                            className="h-8 w-8 p-0 hover:bg-[#FAF0DC]"
                        >
                            <Edit className="h-4 w-4 text-[#C17A2B]" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(pesee)}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </div>
                );
            },
        },
    ];
