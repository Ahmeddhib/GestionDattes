"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UpdateTypeCaisseDialog } from "./UpdateTypeCaisseDialog";
import { DeleteTypeCaisseDialog } from "./DeleteTypeCaisseDialog";

export type TypeCaisse = {
    id: string;
    nom: string;
    poidsKg: number;
    _count?: {
        livraisons: number;
        pretsCaisses: number;
        bonsSortie: number;
        conditionnements: number;
    };
};

export const createTypesCaissesColumns = (
    onUpdate: (typeCaisse: TypeCaisse) => void,
    onDelete: (typeCaisse: TypeCaisse) => void,
    t: (key: string) => string
): ColumnDef<TypeCaisse>[] => [
        {
            accessorKey: "nom",
            header: t("typesCaisses.name"),
            cell: ({ row }) => (
                <div className="font-medium text-[#3D1C00]">{row.getValue("nom")}</div>
            ),
        },
        {
            accessorKey: "poidsKg",
            header: t("typesCaisses.weight"),
            cell: ({ row }) => {
                const poids = row.getValue("poidsKg") as number;
                return (
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-[#FAF0DC] text-[#C17A2B] border-[#F0E0C0]">
                            {poids} {t("typesCaisses.kg")}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: "_count.livraisons",
            header: t("typesCaisses.deliveries"),
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
            accessorKey: "_count.pretsCaisses",
            header: t("typesCaisses.loans"),
            cell: ({ row }) => {
                const count = row.original._count?.pretsCaisses || 0;
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
            accessorKey: "_count.bonsSortie",
            header: t("typesCaisses.outputs"),
            cell: ({ row }) => {
                const count = row.original._count?.bonsSortie || 0;
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
            accessorKey: "_count.conditionnements",
            header: t("typesCaisses.packaging"),
            cell: ({ row }) => {
                const count = row.original._count?.conditionnements || 0;
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
            header: t("typesCaisses.totalUsage"),
            cell: ({ row }) => {
                const total =
                    (row.original._count?.livraisons || 0) +
                    (row.original._count?.pretsCaisses || 0) +
                    (row.original._count?.bonsSortie || 0) +
                    (row.original._count?.conditionnements || 0);
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
                const typeCaisse = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <UpdateTypeCaisseDialog typeCaisse={typeCaisse} />
                        <DeleteTypeCaisseDialog typeCaisse={typeCaisse} />
                    </div>
                );
            },
        },
    ];
