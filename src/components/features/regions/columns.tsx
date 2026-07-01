"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type Region = {
    id: string;
    nom: string;
    code: string | null;
    _count?: {
        agriculteurs: number;
        users: number;
    };
};

export const createRegionsColumns = (
    onUpdate: (region: Region) => void,
    onDelete: (region: Region) => void,
    t: (key: string) => string
): ColumnDef<Region>[] => [
        {
            accessorKey: "nom",
            header: t("regions.name"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">{row.getValue("nom")}</div>
            ),
        },
        {
            accessorKey: "code",
            header: t("regions.code"),
            cell: ({ row }) => {
                const code = row.getValue("code") as string | null;
                return code ? (
                    <Badge variant="outline" className="bg-[#FAF0DC] text-[#C17A2B] border-[#F0E0C0]">
                        {code}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            accessorKey: "_count.agriculteurs",
            header: t("regions.agriculteurs"),
            cell: ({ row }) => {
                const count = row.original._count?.agriculteurs || 0;
                return (
                    <div className="text-center">
                        <Badge variant="secondary" className="bg-[#C17A2B]/10 text-[#C17A2B]">
                            {count}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "_count.users",
            header: t("regions.users"),
            cell: ({ row }) => {
                const count = row.original._count?.users || 0;
                return (
                    <div className="text-center">
                        <Badge variant="secondary" className="bg-[#C17A2B]/10 text-[#C17A2B]">
                            {count}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const region = row.original;

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
                                onClick={() => onUpdate(region)}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(region)}
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
