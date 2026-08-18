"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Edit, Eye, Lock } from "lucide-react";
import Link from "next/link";

export type Saison = {
    id: string;
    nom: string;
    dateDebut: Date;
    dateFin: Date;
    statut: "OUVERTE" | "CLOTUREE";
    createdAt: Date;
    _count?: {
        Vente: number;
    };
};

// Pas d'action "Supprimer" : une saison n'est jamais supprimée (voir
// saison.service.ts). Seule la modification du nom/des dates reste possible,
// et uniquement tant que la saison est ouverte.
export const createSaisonsColumns = (
    t: (key: string) => string,
    onEdit: (saison: Saison) => void
): ColumnDef<Saison>[] => [
    {
        accessorKey: "nom",
        header: t("finance.saisons.nom"),
        cell: ({ row }) => (
            <div className="font-medium text-foreground">{row.getValue("nom")}</div>
        ),
    },
    {
        accessorKey: "dateDebut",
        header: t("finance.saisons.dateDebut"),
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {format(new Date(row.getValue("dateDebut")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        accessorKey: "dateFin",
        header: t("finance.saisons.dateFin"),
        cell: ({ row }) => (
            <span className="text-sm text-muted-foreground">
                {format(new Date(row.getValue("dateFin")), "dd MMM yyyy", { locale: fr })}
            </span>
        ),
    },
    {
        accessorKey: "statut",
        header: t("finance.saisons.statut"),
        cell: ({ row }) => {
            const statut = row.getValue<"OUVERTE" | "CLOTUREE">("statut");
            return (
                <Badge
                    variant={statut === "OUVERTE" ? "default" : "secondary"}
                    className={statut === "OUVERTE" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                    {statut === "OUVERTE" ? t("finance.saisons.ouverte") : t("finance.saisons.cloturee")}
                </Badge>
            );
        },
    },
    {
        accessorKey: "_count.Vente",
        header: t("finance.ventes.title"),
        cell: ({ row }) => {
            const count = row.original._count?.Vente || 0;
            return (
                <Badge
                    variant={count > 0 ? "default" : "secondary"}
                    className={count > 0 ? "bg-[#C17A2B] hover:bg-[#A0621F]" : ""}
                >
                    {count}
                </Badge>
            );
        },
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
            const saison = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/finance/saisons/${saison.id}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-muted"
                            title={t("common.view")}
                        >
                            <Eye className="h-4 w-4 text-[#C17A2B]" />
                        </Button>
                    </Link>
                    {saison.statut === "OUVERTE" && (
                        <Link href={`/dashboard/finance/saisons/${saison.id}/cloture`}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-amber-50"
                                title={t("finance.saisons.cloture.action")}
                            >
                                <Lock className="h-4 w-4 text-amber-700" />
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(saison)}
                        className="h-8 w-8 p-0 hover:bg-muted"
                        title={t("common.edit")}
                    >
                        <Edit className="h-4 w-4 text-[#C17A2B]" />
                    </Button>
                </div>
            );
        },
    },
];
