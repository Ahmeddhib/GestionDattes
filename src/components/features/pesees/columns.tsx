"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type Pesee = {
    id: string;
    livraisonId: string;
    typeCaisseId: string;
    typeCaisse: { id: string; nom: string } | null;
    typeDateId: string;
    typeDate: { id: string; nom: string } | null;
    tareKg: number;
    nombreCaisses: number;
    poidsBrutTotal: number;
    poidsTareTotal: number;
    poidsNetTotal: number;
    poidsBrutMoyen: number;
    poidsNetMoyen: number;
    caisses: { id: string; ordre: number; poidsBrut: number }[];
    createdAt: Date;
    livraison: {
        id: string;
        numeroLot: string;
        dateLivraison: Date;
        Agriculteur: {
            id: string;
            code: string;
            nom: string;
            prenom: string;
        };
    };
};

export const createColumns = (
    t: (key: string) => string,
    onEdit: (pesee: Pesee) => void,
    onDelete: (pesee: Pesee) => void
): ColumnDef<Pesee>[] => [
        {
            accessorKey: "livraison.numeroLot",
            header: t("pesees.numeroLot"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">
                    {row.original.livraison.numeroLot}
                </div>
            ),
        },
        {
            accessorKey: "livraison.Agriculteur",
            header: t("pesees.agriculteur"),
            cell: ({ row }) => {
                const agriculteur = row.original.livraison.Agriculteur;
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
            accessorKey: "typeCaisse.nom",
            header: t("pesees.typeCaisse"),
            cell: ({ row }) => (
                <Badge variant="outline" className="border-[#C17A2B] text-[#C17A2B]">
                    {row.original.typeCaisse?.nom}
                </Badge>
            ),
        },
        {
            accessorKey: "typeDate.nom",
            header: t("pesees.typeDate"),
            cell: ({ row }) => (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {row.original.typeDate?.nom}
                </Badge>
            ),
        },
        {
            accessorKey: "nombreCaisses",
            header: t("pesees.nombreCaisses"),
            cell: ({ row }) => (
                <div className="text-center font-medium">
                    {row.getValue<number>("nombreCaisses")}
                </div>
            ),
        },
        {
            accessorKey: "poidsBrutTotal",
            header: t("pesees.poidsBrutTotal"),
            cell: ({ row }) => (
                <div className="text-right font-medium">
                    {row.getValue<number>("poidsBrutTotal").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "poidsTareTotal",
            header: t("pesees.poidsTareTotal"),
            cell: ({ row }) => (
                <div className="text-right text-gray-500">
                    {row.getValue<number>("poidsTareTotal").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "poidsNetTotal",
            header: t("pesees.poidsNetTotal"),
            cell: ({ row }) => (
                <div className="text-right font-bold text-[#C17A2B]">
                    {row.getValue<number>("poidsNetTotal").toFixed(2)} kg
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
