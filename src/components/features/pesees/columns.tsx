"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LignesDetailDialog } from "./LignesDetailDialog";

export type Pesee = {
    id: string;
    livraisonId: string;
    typeCaisseId: string;
    typeCaisse: { id: string; nom: string } | null;
    typeDateId: string;
    typeDate: { id: string; nom: string } | null;
    tareKg: number;
    nombreCaisses: number;
    poidsBrutTotal: number;
    poidsTareTotal: number;
    poidsNetTotal: number;
    poidsBrutMoyen: number;
    poidsNetMoyen: number;
    prixKg: number;
    quantiteAcceptee: number;
    caisses: { id: string; ordre: number; poidsBrut: number }[];
    createdAt: Date;
    livraison: {
        id: string;
        numeroLot: string;
        dateLivraison: Date;
        Agriculteur: {
            id: string;
            code: string;
            nom: string;
            prenom: string;
        };
    };
};

/**
 * Ligne de pesée telle qu'affichée dans le détail d'une livraison.
 *
 * Sous-ensemble de `Pesee` : le poids de chaque caisse individuelle (`caisses`)
 * n'y figure pas, car le détail n'affiche que le type et les totaux. Le charger
 * ramenait une ligne par caisse pesée, jamais lue.
 */
export type LignePesee = {
    id: string;
    typeCaisse: { id: string; nom: string } | null;
    typeDate: { id: string; nom: string } | null;
    nombreCaisses: number;
    poidsNetTotal: number;
};

/**
 * Une livraison peut contenir plusieurs Pesee (une par combinaison type de
 * datte / type de caisse). Pour l'affichage, elles sont regroupées en une
 * seule ligne de tableau par livraison.
 */
export type PeseeGroupee = {
    livraisonId: string;
    numeroLot: string;
    dateLivraison: Date;
    agriculteur: { id: string; code: string; nom: string; prenom: string };
    lignes: LignePesee[];
    nombreCaisses: number;
    poidsBrutTotal: number;
    poidsTareTotal: number;
    poidsNetTotal: number;
    quantiteAcceptee: number;
    montant: number;
    createdAt: Date;
};

export function groupPeseesByLivraison(pesees: Pesee[]): PeseeGroupee[] {
    const groups = new Map<string, PeseeGroupee>();

    for (const p of pesees) {
        const existing = groups.get(p.livraisonId);
        if (existing) {
            existing.lignes.push(p);
            existing.nombreCaisses += p.nombreCaisses;
            existing.poidsBrutTotal += p.poidsBrutTotal;
            existing.poidsTareTotal += p.poidsTareTotal;
            existing.poidsNetTotal += p.poidsNetTotal;
            existing.quantiteAcceptee += p.quantiteAcceptee;
            existing.montant += p.prixKg * p.quantiteAcceptee;
            if (p.createdAt > existing.createdAt) {
                existing.createdAt = p.createdAt;
            }
        } else {
            groups.set(p.livraisonId, {
                livraisonId: p.livraisonId,
                numeroLot: p.livraison.numeroLot,
                dateLivraison: p.livraison.dateLivraison,
                agriculteur: p.livraison.Agriculteur,
                lignes: [p],
                nombreCaisses: p.nombreCaisses,
                poidsBrutTotal: p.poidsBrutTotal,
                poidsTareTotal: p.poidsTareTotal,
                poidsNetTotal: p.poidsNetTotal,
                quantiteAcceptee: p.quantiteAcceptee,
                montant: p.prixKg * p.quantiteAcceptee,
                createdAt: p.createdAt,
            });
        }
    }

    return Array.from(groups.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/**
 * Table Pesée en lecture seule : les Pesee sont toujours générées automatiquement
 * à partir d'une Livraison (voir NouvellePeseeWizard / UpdateLivraisonDialog) et
 * ne peuvent plus être créées, modifiées ou supprimées manuellement ici.
 * Une livraison peut avoir plusieurs lignes (types de datte/caisse) : elles
 * sont regroupées en une seule ligne de tableau (voir groupPeseesByLivraison).
 */
export const createColumns = (t: (key: string) => string): ColumnDef<PeseeGroupee>[] => [
        {
            accessorKey: "numeroLot",
            header: t("pesees.numeroLot"),
            cell: ({ row }) => (
                <div className="font-medium text-foreground">
                    {row.original.numeroLot}
                </div>
            ),
        },
        {
            accessorKey: "agriculteur",
            header: t("pesees.agriculteur"),
            cell: ({ row }) => {
                const agriculteur = row.original.agriculteur;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                            {agriculteur.nom} {agriculteur.prenom}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {agriculteur.code}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "lignes",
            header: t("nouvellePesee.lignes"),
            cell: ({ row }) => (
                <LignesDetailDialog numeroLot={row.original.numeroLot} lignes={row.original.lignes} />
            ),
        },
        {
            accessorKey: "nombreCaisses",
            header: t("pesees.nombreCaisses"),
            // Un décompte se centre ; les poids et montants s'alignent à droite
            // pour que les ordres de grandeur se comparent d'un coup d'œil.
            meta: { align: "center" },
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.getValue<number>("nombreCaisses")}
                </div>
            ),
        },
        {
            accessorKey: "poidsBrutTotal",
            header: t("pesees.poidsBrutTotal"),
            meta: { align: "right" },
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.getValue<number>("poidsBrutTotal").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "poidsTareTotal",
            header: t("pesees.poidsTareTotal"),
            meta: { align: "right" },
            cell: ({ row }) => (
                <div className="text-muted-foreground">
                    {row.getValue<number>("poidsTareTotal").toFixed(2)} kg
                </div>
            ),
        },
        {
            accessorKey: "poidsNetTotal",
            header: t("pesees.poidsNetTotal"),
            meta: { align: "right" },
            cell: ({ row }) => (
                <div className="font-bold text-[#C17A2B]">
                    {row.getValue<number>("poidsNetTotal").toFixed(2)} kg
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
            accessorKey: "createdAt",
            header: t("pesees.datePesee"),
            cell: ({ row }) => {
                const date = row.getValue<Date>("createdAt");
                return (
                    <span className="text-sm text-muted-foreground">
                        {format(new Date(date), "dd MMM yyyy HH:mm", { locale: fr })}
                    </span>
                );
            },
        },
    ];
