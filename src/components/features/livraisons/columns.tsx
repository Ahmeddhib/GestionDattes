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
    quantiteLivree?: number;
    quantiteAcceptee?: number;
    agriculteur?: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
        cin: string;
    };
    caisses?: Array<{
        id: string;
        typeCaisseId: string;
        typeDateId: string;
        quantite: number;
        typeCaisse: {
            id: string;
            nom: string;
            poidsKg: number;
        };
        typeDate?: {
            id: string;
            nom: string;
        };
    }>;
    bonAchat?: {
        id: string;
        numero: string;
        prixKg: number;
        montant: number;
    } | null;
    _count?: {
        echantillons: number;
        pretsCaisses: number;
        stocksDates: number;
        pesees: number;
    };
};

export const createLivraisonsColumns = (
    onUpdate: (livraison: Livraison) => void,
    onDelete: (livraison: Livraison) => void,
    t: (key: string) => string,
    canEditAcceptedQuantity: boolean
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
            accessorKey: "caisses",
            header: t("livraisons.caisses"),
            cell: ({ row }) => {
                const caisses = row.original.caisses;
                if (!caisses || caisses.length === 0) {
                    return <span className="text-muted-foreground">—</span>;
                }

                return (
                    <div className="space-y-1 max-w-[280px]">
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
                                    {caisse.typeDate && (
                                        <span className="text-green-700">· {caisse.typeDate.nom}</span>
                                    )}{" "}
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
            accessorKey: "quantiteAcceptee",
            header: "Acceptée",
            cell: ({ row }) => (
                <div className="font-medium text-green-700">
                    {(row.original.quantiteAcceptee ?? row.original.quantiteKg).toFixed(2)} kg
                </div>
            ),
        },
        {
            id: "peseeProgress",
            header: t("livraisons.peseeProgress"),
            cell: ({ row }) => {
                const nbTypesCaisses = row.original.caisses?.length ?? 0;
                const nbPesees = row.original._count?.pesees ?? 0;

                if (nbTypesCaisses === 0) {
                    return <span className="text-muted-foreground">—</span>;
                }

                const complete = nbPesees >= nbTypesCaisses;
                return (
                    <Badge
                        variant="outline"
                        className={
                            complete
                                ? "bg-green-50 text-green-700 border-green-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                        }
                    >
                        {nbPesees}/{nbTypesCaisses} {t("livraisons.typesPeses")}
                    </Badge>
                );
            },
        },
        {
            id: "bonAchat",
            header: t("bonAchat.title"),
            cell: ({ row }) => {
                const bonAchat = row.original.bonAchat;
                if (!bonAchat) {
                    return <span className="text-muted-foreground">—</span>;
                }
                return (
                    <div className="text-xs">
                        <Badge variant="outline" className="bg-[#C17A2B]/10 text-[#C17A2B] border-[#C17A2B]/30 font-mono">
                            {bonAchat.numero}
                        </Badge>
                        <div className="font-semibold text-[#3D1C00] mt-1">
                            {bonAchat.montant.toFixed(2)}
                        </div>
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
                        <UpdateLivraisonDialog
                            livraison={livraison}
                            canEditAcceptedQuantity={canEditAcceptedQuantity}
                        />
                        <DeleteLivraisonDialog livraison={livraison} />
                    </div>
                );
            },
        },
    ];
