"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type Agriculteur = {
    id: string;
    code: string;
    cin: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    adresse: string | null;
    nbPalmiers: number;
    superficie: number | null;
    productionEstimee: number | null;
    regionId: string;
    region: {
        id: string;
        nom: string;
        code: string | null;
    };
};

export const createAgricultureursColumns = (
    onUpdate: (agriculteur: Agriculteur) => void,
    onDelete: (agriculteur: Agriculteur) => void,
    t: (key: string) => string
): ColumnDef<Agriculteur>[] => [
        {
            accessorKey: "code",
            header: t("agriculteurs.code"),
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-[#FAF0DC] text-[#C17A2B] border-[#F0E0C0] font-mono">
                    {row.getValue("code")}
                </Badge>
            ),
        },
        {
            id: "nomComplet",
            header: t("agriculteurs.nomComplet"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C17A2B]/10">
                        <User className="h-4 w-4 text-[#C17A2B]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-[#3D1C00]">
                            {row.original.nom} {row.original.prenom}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {t("agriculteurs.cin")}: {row.original.cin}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "region.nom",
            header: t("agriculteurs.region"),
            cell: ({ row }) => {
                const region = row.original.region;
                return (
                    <Badge variant="secondary" className="bg-[#FAF0DC] text-[#3D1C00] border-[#F0E0C0]">
                        {region.nom}
                        {region.code && ` (${region.code})`}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "telephone",
            header: t("agriculteurs.telephone"),
            cell: ({ row }) => {
                const telephone = row.getValue("telephone") as string | null;
                return telephone ? (
                    <span className="text-sm">{telephone}</span>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            accessorKey: "nbPalmiers",
            header: t("agriculteurs.nbPalmiers"),
            cell: ({ row }) => (
                <div className="text-center">
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                        {row.getValue("nbPalmiers")} 🌴
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: "superficie",
            header: t("agriculteurs.superficie"),
            cell: ({ row }) => {
                const superficie = row.getValue("superficie") as number | null;
                return superficie ? (
                    <div className="text-right font-mono">{superficie.toFixed(1)} ha</div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            accessorKey: "productionEstimee",
            header: t("agriculteurs.production"),
            cell: ({ row }) => {
                const production = row.getValue("productionEstimee") as number | null;
                return production ? (
                    <div className="text-right font-mono">{production.toLocaleString()} kg</div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const agriculteur = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#3D1C00] hover:bg-[#FAF0DC]"
                            >
                                <span className="sr-only">{t("common.actions")}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white">
                            <DropdownMenuItem
                                onClick={() => onUpdate(agriculteur)}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(agriculteur)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
