"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LignesDetailDialog } from "./LignesDetailDialog";
import { BonAchatActions } from "./BonAchatActions";
import type { TenantForInvoice } from "@/lib/bon-achat-pdf";

export type BonAchat = {
    id: string;
    numero: string;
    prixKg: number;
    montant: number;
    observations: string | null;
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
        Pesee: {
            id: string;
            prixKg: number;
            quantiteAcceptee: number;
            poidsNetTotal: number;
            typeDate: { id: string; nom: string } | null;
            typeCaisse: { id: string; nom: string } | null;
        }[];
    };
    User: {
        id: string;
        name: string;
    };
};

export const createBonsAchatColumns = (
    t: (key: string) => string,
    tenant: TenantForInvoice
): ColumnDef<BonAchat>[] => [
    {
        accessorKey: "numero",
        header: t("bonAchat.numero"),
        cell: ({ row }) => (
            <Badge variant="outline" className="bg-[#C17A2B]/10 text-[#C17A2B] border-[#C17A2B]/30 font-mono">
                {row.getValue("numero")}
            </Badge>
        ),
    },
    {
        accessorKey: "Livraison.numeroLot",
        header: t("livraisons.numeroLot"),
        cell: ({ row }) => (
            <span className="text-sm text-[#3D1C00]">{row.original.Livraison.numeroLot}</span>
        ),
    },
    {
        accessorKey: "Livraison.Agriculteur",
        header: t("livraisons.agriculteur"),
        cell: ({ row }) => {
            const agriculteur = row.original.Livraison.Agriculteur;
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-[#3D1C00]">
                        {agriculteur.nom} {agriculteur.prenom}
                    </span>
                    <span className="text-xs text-gray-500">{agriculteur.code}</span>
                </div>
            );
        },
    },
    {
        id: "lignes",
        header: t("bonAchat.detailLignes"),
        cell: ({ row }) => (
            <LignesDetailDialog numero={row.original.numero} lignes={row.original.Livraison.Pesee} />
        ),
    },
    {
        accessorKey: "prixKg",
        header: t("bonAchat.prixKgMoyen"),
        cell: ({ row }) => (
            <div className="text-right text-[#3D1C00]">
                {row.getValue<number>("prixKg").toFixed(3)}
            </div>
        ),
    },
    {
        accessorKey: "montant",
        header: t("bonAchat.montant"),
        cell: ({ row }) => (
            <div className="text-right font-bold text-[#C17A2B]">
                {row.getValue<number>("montant").toFixed(2)}
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
        accessorKey: "observations",
        header: t("bonAchat.observations"),
        cell: ({ row }) => {
            const observations = row.getValue<string | null>("observations");
            return observations ? (
                <span className="text-sm text-[#3D1C00]/70 line-clamp-2 max-w-55">
                    {observations}
                </span>
            ) : (
                <span className="text-muted-foreground">—</span>
            );
        },
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => <BonAchatActions bonAchat={row.original} tenant={tenant} />,
        enableSorting: false,
        enableHiding: false,
    },
];
