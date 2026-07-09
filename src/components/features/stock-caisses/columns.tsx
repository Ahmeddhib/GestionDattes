"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { RetourDialog } from "./RetourDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type PretCaisse = {
    id: string;
    nombrePrete: number;
    nombreRetourne: number;
    nombreRestant: number;
    statut: "EN_COURS" | "RETOURNE" | "INCOMPLET";
    datePreT: Date;
    dateRetour?: Date | null;
    observations?: string | null;
    agriculteur: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
    };
    typeCaisse: {
        id: string;
        nom: string;
        poidsKg: number;
    };
};

export const createPretsColumns = (
    t: (key: string) => string
): ColumnDef<PretCaisse>[] => [
        {
            accessorKey: "agriculteur",
            header: t("pretsCaisses.agriculteur"),
            cell: ({ row }) => {
                const agriculteur = row.original.agriculteur;
                return (
                    <div className="font-medium text-[#3D1C00]">
                        {agriculteur.nom} {agriculteur.prenom}
                        <div className="text-xs text-[#3D1C00]/60">{agriculteur.code}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "typeCaisse",
            header: t("pretsCaisses.typeCaisse"),
            cell: ({ row }) => {
                const typeCaisse = row.original.typeCaisse;
                return (
                    <div className="text-sm text-[#3D1C00]">
                        {typeCaisse.nom}
                        <div className="text-xs text-[#3D1C00]/60">
                            {typeCaisse.poidsKg} kg
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "nombrePrete",
            header: t("pretsCaisses.nombrePrete"),
            cell: ({ row }) => (
                <div className="font-semibold text-[#C17A2B]">
                    {row.getValue("nombrePrete")}
                </div>
            ),
        },
        {
            accessorKey: "nombreRetourne",
            header: t("pretsCaisses.nombreRetourne"),
            cell: ({ row }) => (
                <div className="font-semibold text-green-600">
                    {row.getValue("nombreRetourne")}
                </div>
            ),
        },
        {
            accessorKey: "nombreRestant",
            header: t("pretsCaisses.nombreRestant"),
            cell: ({ row }) => {
                const restant = row.getValue("nombreRestant") as number;
                return (
                    <div className={`font-bold ${restant > 0 ? "text-orange-600" : "text-gray-400"}`}>
                        {restant}
                    </div>
                );
            },
        },
        {
            accessorKey: "statut",
            header: t("pretsCaisses.statut"),
            cell: ({ row }) => {
                const statut = row.getValue("statut") as string;
                const variants: Record<string, any> = {
                    EN_COURS: "default",
                    RETOURNE: "secondary",
                    INCOMPLET: "destructive",
                };
                const labels: Record<string, string> = {
                    EN_COURS: t("pretsCaisses.enCours"),
                    RETOURNE: t("pretsCaisses.retourne"),
                    INCOMPLET: t("pretsCaisses.incomplet"),
                };
                return (
                    <Badge variant={variants[statut] || "default"}>
                        {labels[statut] || statut}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "datePreT",
            header: t("pretsCaisses.datePret"),
            cell: ({ row }) => {
                const date = new Date(row.getValue("datePreT"));
                return (
                    <div className="text-sm text-[#3D1C00]">
                        {format(date, "dd/MM/yyyy", { locale: fr })}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const pret = row.original;
                if (pret.statut === "RETOURNE") {
                    return <span className="text-xs text-gray-400">{t("pretsCaisses.pretCloture")}</span>;
                }
                return <RetourDialog pret={pret} />;
            },
        },
    ];
