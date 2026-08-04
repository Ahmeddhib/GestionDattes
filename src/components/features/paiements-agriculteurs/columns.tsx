"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { RecordPaiementDialog } from "./RecordPaiementDialog";
import { PaiementsHistoryDialog } from "./PaiementsHistoryDialog";

export type BonAchatAvecSolde = {
    id: string;
    numero: string;
    montant: number;
    montantPaye: number;
    montantRestant: number;
    statut: "EN_ATTENTE" | "PARTIEL" | "PAYE";
    createdAt: Date;
    Livraison: {
        numeroLot: string;
        Agriculteur: {
            id: string;
            code: string;
            nom: string;
            prenom: string;
        };
    };
};

const STATUT_CONFIG: Record<string, { labelKey: string; className: string }> = {
    EN_ATTENTE: { labelKey: "finance.paiements.statutEnAttente", className: "bg-gray-200 text-gray-700" },
    PARTIEL: { labelKey: "finance.paiements.statutPartiel", className: "bg-amber-500 hover:bg-amber-600" },
    PAYE: { labelKey: "finance.paiements.statutPaye", className: "bg-green-600 hover:bg-green-700" },
};

export const createPaiementsColumns = (
    t: (key: string) => string
): ColumnDef<BonAchatAvecSolde>[] => [
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
        accessorKey: "montant",
        header: t("finance.paiements.montantTotal"),
        cell: ({ row }) => (
            <div className="text-right text-[#3D1C00]">{row.getValue<number>("montant").toFixed(2)}</div>
        ),
    },
    {
        accessorKey: "montantPaye",
        header: t("finance.paiements.montantPaye"),
        cell: ({ row }) => (
            <div className="text-right font-semibold text-green-600">
                {row.getValue<number>("montantPaye").toFixed(2)}
            </div>
        ),
    },
    {
        accessorKey: "montantRestant",
        header: t("finance.paiements.montantRestant"),
        cell: ({ row }) => {
            const restant = row.getValue<number>("montantRestant");
            return (
                <div className={`text-right font-bold ${restant > 0 ? "text-orange-600" : "text-gray-400"}`}>
                    {restant.toFixed(2)}
                </div>
            );
        },
    },
    {
        accessorKey: "statut",
        header: t("finance.paiements.statut"),
        cell: ({ row }) => {
            const statut = row.getValue<string>("statut");
            const config = STATUT_CONFIG[statut] ?? STATUT_CONFIG.EN_ATTENTE;
            return <Badge className={config.className}>{t(config.labelKey)}</Badge>;
        },
    },
    {
        accessorKey: "createdAt",
        header: t("pesees.datePesee"),
        cell: ({ row }) => (
            <span className="text-sm text-gray-600">
                {format(new Date(row.getValue<Date>("createdAt")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
            const bonAchat = row.original;
            return (
                <div className="flex items-center gap-2">
                    <PaiementsHistoryDialog bonAchatId={bonAchat.id} numero={bonAchat.numero} />
                    {bonAchat.statut !== "PAYE" && (
                        <RecordPaiementDialog bonAchatId={bonAchat.id} numero={bonAchat.numero} />
                    )}
                </div>
            );
        },
    },
];
