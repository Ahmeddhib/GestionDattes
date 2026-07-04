"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UpdateTypeDateDialog } from "./UpdateTypeDateDialog";
import { DeleteTypeDateDialog } from "./DeleteTypeDateDialog";

export type TypeDate = {
    id: string;
    nom: string;
    description: string | null;
    _count?: {
        livraisons: number;
        stocksDates: number;
    };
};

export const createTypesDatesColumns = (
    onUpdate: (typeDate: TypeDate) => void,
    onDelete: (typeDate: TypeDate) => void,
    t: (key: string) => string
): ColumnDef<TypeDate>[] => [
        {
            accessorKey: "nom",
            header: t("typesDates.name"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">{row.getValue("nom")}</div>
            ),
        },
        {
            accessorKey: "description",
            header: t("typesDates.descriptionLabel"),
            cell: ({ row }) => {
                const description = row.getValue("description") as string | null;
                return description ? (
                    <div className="text-sm text-[#3D1C00]/70 max-w-md truncate">
                        {description}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "_count.livraisons",
            header: t("typesDates.livraisons"),
            cell: ({ row }) => {
                const count = row.original._count?.livraisons || 0;
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
            accessorKey: "_count.stocksDates",
            header: t("typesDates.stocksDates"),
            cell: ({ row }) => {
                const count = row.original._count?.stocksDates || 0;
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
            id: "totalUsage",
            header: t("typesDates.totalUsage"),
            cell: ({ row }) => {
                const total =
                    (row.original._count?.livraisons || 0) +
                    (row.original._count?.stocksDates || 0);
                return (
                    <div className="text-center">
                        <Badge className="bg-[#C17A2B] text-white hover:bg-[#C17A2B]/90">
                            {total}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const typeDate = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <UpdateTypeDateDialog typeDate={typeDate} />
                        <DeleteTypeDateDialog typeDate={typeDate} />
                    </div>
                );
            },
        },
    ];
