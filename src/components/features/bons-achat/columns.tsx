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
    montantPaye?: number;
    montantRestant?: number;
    statut?: "EN_ATTENTE" | "PARTIEL" | "PAYE";
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
            <span className="text-sm text-foreground">{row.original.Livraison.numeroLot}</span>
        ),
    },
    {
        accessorKey: "Livraison.Agriculteur",
        header: t("livraisons.agriculteur"),
        cell: ({ row }) => {
            const agriculteur = row.original.Livraison.Agriculteur;
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                        {agriculteur.nom} {agriculteur.prenom}
                    </span>
                    <span className="text-xs text-muted-foreground">{agriculteur.code}</span>
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
        meta: { align: "right" },
        cell: ({ row }) => (
            <div className="text-foreground">
                {row.getValue<number>("prixKg").toFixed(3)}
            </div>
        ),
    },
    {
        accessorKey: "montant",
        header: t("bonAchat.montant"),
        meta: { align: "right" },
        cell: ({ row }) => (
            <div className="font-bold text-[#C17A2B]">
                {row.getValue<number>("montant").toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: "statut",
        header: t("finance.paiements.statut"),
        cell: ({ row }) => {
            const statut = row.original.statut ?? "EN_ATTENTE";
            const config: Record<string, { labelKey: string; className: string }> = {
                EN_ATTENTE: { labelKey: "finance.paiements.statutEnAttente", className: "bg-gray-200 text-gray-700" },
                PARTIEL: { labelKey: "finance.paiements.statutPartiel", className: "bg-amber-500 hover:bg-amber-600" },
                PAYE: { labelKey: "finance.paiements.statutPaye", className: "bg-green-600 hover:bg-green-700" },
            };
            const c = config[statut];
            return <Badge className={c.className}>{t(c.labelKey)}</Badge>;
        },
    },
    {
        accessorKey: "createdAt",
        // Idem : ce n'est pas une date de pesée mais la création du bon d'achat.
        header: t("bonAchat.dateCreation"),
        cell: ({ row }) => {
            const date = row.getValue<Date>("createdAt");
            return (
                <span className="text-sm text-muted-foreground">
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
                <span className="text-sm text-muted-foreground line-clamp-2 max-w-55">
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
