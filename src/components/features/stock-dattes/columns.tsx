"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LotsDetailDialog } from "./LotsDetailDialog";

export type Lot = {
    id: string;
    numeroLot: string;
    agriculteur: string;
    dateEntree: Date;
    quantite: number;
    quantiteDisponible: number;
};

export type StockDateGroupe = {
    typeDateId: string;
    typeDate: string;
    quantiteTotale: number;
    quantiteDisponible: number;
    lots: Lot[];
};

export const createStockDattesColumns = (t: (key: string) => string): ColumnDef<StockDateGroupe>[] => [
    {
        accessorKey: "typeDate",
        header: t("stockDattes.typeDate"),
        cell: ({ row }) => (
            <div className="font-medium text-[#3D1C00]">{row.original.typeDate}</div>
        ),
    },
    {
        id: "lots",
        header: t("stockDattes.nombreLots"),
        cell: ({ row }) => (
            <LotsDetailDialog typeDate={row.original.typeDate} lots={row.original.lots} />
        ),
    },
    {
        accessorKey: "quantiteTotale",
        header: t("stockDattes.quantiteTotale"),
        cell: ({ row }) => (
            <div className="text-right font-medium">
                {row.getValue<number>("quantiteTotale").toFixed(2)} kg
            </div>
        ),
    },
    {
        accessorKey: "quantiteDisponible",
        header: t("stockDattes.quantiteDisponible"),
        cell: ({ row }) => (
            <div className="text-right font-bold text-[#C17A2B]">
                {row.getValue<number>("quantiteDisponible").toFixed(2)} kg
            </div>
        ),
    },
];
