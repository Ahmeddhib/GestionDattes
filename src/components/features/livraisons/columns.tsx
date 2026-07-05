"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { UpdateLivraisonDialog } from "./UpdateLivraisonDialog";
import { DeleteLivraisonDialog } from "./DeleteLivraisonDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type Livraison = {
    id: string;
    numeroLot: string;
    dateLivraison: Date;
    quantiteKg: number;
    agriculteur?: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
        cin: string;
    };
    typeDate?: {
        id: string;
        nom: string;
    };
    caisses?: Array<{
        id: string;
        typeCaisseId: string;
        quantite: number;
        typeCaisse: {
            id: string;
            nom: string;
            poidsKg: number;
        };
    }>;
    _count?: {
        echantillons: number;
        pretsCaisses: number;
        stocksDates: number;
    };
};

export const createLivraisonsColumns = (
    onUpdate: (livraison: Livraison) => void,
    onDelete: (livraison: Livraison) => void,
    t: (key: string) => string
): ColumnDef<Livraison>[] => [
        {
            accessorKey: "numeroLot",
            header: t("livraisons.numeroLot"),
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-[#C17A2B]/10 text-[#C17A2B] border-[#C17A2B]/30 font-mono">
                    {row.getValue("numeroLot")}
                </Badge>
            ),
        },
        {
            accessorKey: "dateLivraison",
            header: t("livraisons.dateLivraison"),
            cell: ({ row }) => {
                const date = new Date(row.getValue("dateLivraison"));
                return (
                    <div className="text-sm text-[#3D1C00]">
                        {format(date, "dd/MM/yyyy", { locale: fr })}
                    </div>
                );
            },
        },
        {
            accessorKey: "agriculteur",
            header: t("livraisons.agriculteur"),
            cell: ({ row }) => {
                const agriculteur = row.original.agriculteur;
                return agriculteur ? (
                    <div className="font-medium text-[#3D1C00]">
                        {agriculteur.nom} {agriculteur.prenom}
                        <div className="text-xs text-[#3D1C00]/60">{agriculteur.code}</div>
                    </div>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            accessorKey: "typeDate",
            header: t("livraisons.typeDate"),
            cell: ({ row }) => {
                const typeDate = row.original.typeDate;
                return typeDate ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {typeDate.nom}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                );
            },
        },
        {
            accessorKey: "caisses",
            header: t("livraisons.caisses"),
            cell: ({ row }) => {
                const caisses = row.original.caisses;
                if (!caisses || caisses.length === 0) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="space-y-1 max-w-[250px]">
                        {caisses.map((caisse, index) => {
                            const totalKg = caisse.quantite * caisse.typeCaisse.poidsKg;
                            return (
                                <div key={index} className="text-xs">
                                    <span className="font-medium text-[#C17A2B]">
                                        {caisse.quantite}x
                                    </span>{" "}
                                    <span className="text-[#3D1C00]">
                                        {caisse.typeCaisse.nom}
                                    </span>{" "}
                                    <span className="text-[#3D1C00]/60">
                                        ({totalKg.toFixed(2)} kg)
                                    </span>
                                </div>
                            );
                        })}
                        {caisses.length > 1 && (
                            <div className="text-xs font-semibold text-[#C17A2B] pt-1 border-t border-[#C17A2B]/20">
                                Total: {row.original.quantiteKg.toFixed(2)} kg
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "quantiteKg",
            header: t("livraisons.quantiteKg"),
            cell: ({ row }) => {
                const quantite = row.getValue("quantiteKg") as number;
                return (
                    <div className="font-semibold text-[#C17A2B]">
                        {quantite.toFixed(2)} {t("livraisons.kg")}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: t("common.actions"),
            cell: ({ row }) => {
                const livraison = row.original;

                return (
                    <div className="flex items-center gap-2">
                        <UpdateLivraisonDialog livraison={livraison} />
                        <DeleteLivraisonDialog livraison={livraison} />
                    </div>
                );
            },
        },
    ];
