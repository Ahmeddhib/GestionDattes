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

/**
 * Une ligne du tableau = un type de datte, agrégé par la base.
 *
 * `nombreLots` remplace le tableau `lots` d'origine : la ligne n'a besoin que du
 * compte pour s'afficher, et embarquer chaque lot sérialisait tout le stock dans
 * la page pour un détail rarement ouvert.
 */
export type StockDateGroupe = {
    typeDateId: string;
    typeDate: string;
    quantiteTotale: number;
    quantiteDisponible: number;
    nombreLots: number;
};

export const createStockDattesColumns = (
    t: (key: string) => string,
    /**
     * Saison déjà résolue côté serveur (et non la valeur brute de l'URL, qui
     * peut valoir « courante »). Sans elle, le détail listerait les lots de
     * toutes les saisons sous une ligne filtrée sur une seule.
     */
    saisonId?: string
): ColumnDef<StockDateGroupe>[] => [
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
            <LotsDetailDialog
                typeDateId={row.original.typeDateId}
                typeDate={row.original.typeDate}
                nombreLots={row.original.nombreLots}
                saisonId={saisonId}
            />
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
