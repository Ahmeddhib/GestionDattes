"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit } from "lucide-react";
import { RecordEncaissementDialog } from "./RecordEncaissementDialog";
import { EncaissementsHistoryDialog } from "./EncaissementsHistoryDialog";

export type Vente = {
    id: string;
    date: Date;
    quantite: number;
    prixUnitaire: number;
    montant: number;
    montantEncaisse: number;
    montantRestant: number;
    statut: "EN_ATTENTE" | "PARTIEL" | "PAYE";
    createdAt: Date;
    Client: {
        id: string;
        nom: string;
        telephone: string | null;
    };
    StockDate: {
        id: string;
        TypeDate: { id: string; nom: string };
        Livraison: { id: string; numeroLot: string };
    };
    Saison: { id: string; nom: string } | null;
};

const STATUT_CONFIG: Record<string, { labelKey: string; className: string }> = {
    EN_ATTENTE: { labelKey: "finance.paiements.statutEnAttente", className: "bg-gray-200 text-gray-700" },
    PARTIEL: { labelKey: "finance.paiements.statutPartiel", className: "bg-amber-500 hover:bg-amber-600" },
    PAYE: { labelKey: "finance.paiements.statutPaye", className: "bg-green-600 hover:bg-green-700" },
};

export const createVentesColumns = (
    t: (key: string) => string,
    onEdit: (vente: Vente) => void
): ColumnDef<Vente>[] => [
    {
        accessorKey: "Client",
        header: t("finance.ventes.client"),
        cell: ({ row }) => (
            <div className="font-medium text-[#3D1C00]">{row.original.Client.nom}</div>
        ),
    },
    {
        accessorKey: "StockDate",
        header: t("finance.ventes.lotStock"),
        cell: ({ row }) => {
            const sd = row.original.StockDate;
            return (
                <div className="text-sm text-[#3D1C00]">
                    {sd.TypeDate.nom}
                    <div className="text-xs text-gray-500">Lot {sd.Livraison.numeroLot}</div>
                </div>
            );
        },
    },
    {
        accessorKey: "quantite",
        header: t("finance.ventes.quantite"),
        cell: ({ row }) => (
            <div className="text-right text-[#3D1C00]">{row.getValue<number>("quantite").toFixed(2)} kg</div>
        ),
    },
    {
        accessorKey: "prixUnitaire",
        header: t("finance.ventes.prixUnitaire"),
        cell: ({ row }) => (
            <div className="text-right text-[#3D1C00]">{row.getValue<number>("prixUnitaire").toFixed(3)}</div>
        ),
    },
    {
        accessorKey: "montant",
        header: t("finance.ventes.montantTotal"),
        cell: ({ row }) => (
            <div className="text-right font-bold text-[#C17A2B]">{row.getValue<number>("montant").toFixed(2)}</div>
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
            const vente = row.original;
            return (
                <div className="flex items-center gap-2">
                    <EncaissementsHistoryDialog venteId={vente.id} clientNom={vente.Client.nom} />
                    {vente.statut === "EN_ATTENTE" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(vente)}
                            className="h-8 w-8 p-0 hover:bg-[#FAF0DC]"
                        >
                            <Edit className="h-4 w-4 text-[#C17A2B]" />
                        </Button>
                    )}
                    {vente.statut !== "PAYE" && (
                        <RecordEncaissementDialog
                            venteId={vente.id}
                            clientNom={vente.Client.nom}
                            montantRestant={vente.montantRestant}
                        />
                    )}
                </div>
            );
        },
    },
];
