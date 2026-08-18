"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    Loader2,
    RotateCw,
    Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { getLotsStockPageAction } from "@/actions/stock-dates/get-lots-page.action";
import type { PaginatedResult } from "@/lib/pagination";
import type { Lot } from "./columns";

const TAILLE_PAGE = 10;

interface LotsDetailDialogProps {
    typeDateId: string;
    typeDate: string;
    nombreLots: number;
    saisonId?: string;
}

/**
 * Détail des lots d'un type de datte, chargé à l'ouverture et paginé.
 *
 * Les lots arrivaient auparavant dans les props, donc dans la charge utile de la
 * page : tout le stock du tenant était sérialisé à chaque affichage du tableau,
 * pour un détail que l'on ouvre rarement.
 *
 * La pagination est locale et non portée par l'URL, contrairement aux tableaux de
 * page : les paramètres de la boîte de dialogue entreraient en conflit avec ceux
 * du tableau qui la contient, et survivraient à sa fermeture.
 */
export function LotsDetailDialog({
    typeDateId,
    typeDate,
    nombreLots,
    saisonId,
}: LotsDetailDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [rechercheDraft, setRechercheDraft] = useState("");
    const [recherche, setRecherche] = useState("");
    const [resultat, setResultat] = useState<PaginatedResult<Lot> | null>(null);
    const [chargement, setChargement] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    /** Incrémenté par « Réessayer » : relance l'effet de chargement. */
    const [tentative, setTentative] = useState(0);

    // Recherche différée : sans cela, chaque frappe déclencherait un appel serveur.
    useEffect(() => {
        const minuteur = setTimeout(() => setRecherche(rechercheDraft), 350);
        return () => clearTimeout(minuteur);
    }, [rechercheDraft]);

    useEffect(() => {
        if (!open) return;

        // `annule` écarte la réponse d'une requête dépassée par une plus récente :
        // sans ce garde, une page lente arrivant après une page rapide écraserait
        // l'affichage par un contenu périmé.
        let annule = false;

        async function charger() {
            setChargement(true);
            setErreur(null);
            try {
                const reponse = await getLotsStockPageAction({
                    typeDateId,
                    page,
                    pageSize: TAILLE_PAGE,
                    search: recherche,
                    sortBy: "dateEntree",
                    sortDir: "desc",
                    saisonId,
                });
                if (annule) return;

                // Un échec doit se VOIR. Ne rien faire ici laissait `resultat` à
                // `null`, donc le tableau affichait « Aucun résultat » : une base
                // injoignable devenait indiscernable d'un type sans lot.
                if (reponse.success) setResultat(reponse.data);
                else setErreur(reponse.error || t("messages.error.generic"));
            } catch {
                // L'action intercepte déjà ses erreurs, mais une coupure réseau
                // peut faire échouer l'appel lui-même.
                if (!annule) setErreur(t("messages.error.generic"));
            } finally {
                if (!annule) setChargement(false);
            }
        }

        void charger();
        return () => {
            annule = true;
        };
    }, [open, page, recherche, typeDateId, saisonId, tentative, t]);

    function surChangementOuverture(ouvert: boolean) {
        setOpen(ouvert);
        if (!ouvert) {
            // Réinitialisation à la fermeture : réouvrir doit repartir du début,
            // pas d'une page 4 filtrée oubliée là.
            setPage(1);
            setRechercheDraft("");
            setRecherche("");
            setResultat(null);
            setErreur(null);
        }
    }

    const lots = resultat?.items ?? [];

    return (
        <Dialog open={open} onOpenChange={surChangementOuverture}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-sm border-[#C17A2B]/30 text-[#3D1C00] hover:bg-[#FAF0DC]"
                >
                    <Eye className="h-3.5 w-3.5 text-[#C17A2B]" />
                    {t("stockDattes.voirLots")} ({nombreLots})
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-160 bg-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-[#C17A2B]" />
                        {typeDate}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("stockDattes.detailLots")}
                    </DialogDescription>
                </DialogHeader>

                <Input
                    value={rechercheDraft}
                    onChange={(e) => {
                        setRechercheDraft(e.target.value);
                        // Revenir en page 1 : rester en page 3 d'un jeu qui vient
                        // de se réduire afficherait un tableau vide.
                        setPage(1);
                    }}
                    placeholder={t("stockDattes.searchLotPlaceholder")}
                    className="rounded-sm border-border focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                />

                <div className={chargement ? "pointer-events-none opacity-60" : undefined}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("livraisons.numeroLot")}</TableHead>
                                <TableHead>{t("livraisons.agriculteur")}</TableHead>
                                <TableHead>{t("stockDattes.dateEntree")}</TableHead>
                                <TableHead className="text-right">{t("stockDattes.quantiteTotale")}</TableHead>
                                <TableHead className="text-right">{t("stockDattes.quantiteDisponible")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lots.map((lot) => (
                                <TableRow key={lot.id}>
                                    <TableCell className="font-medium text-[#3D1C00]">{lot.numeroLot}</TableCell>
                                    <TableCell className="text-gray-600">{lot.agriculteur}</TableCell>
                                    <TableCell className="text-gray-600">
                                        {format(new Date(lot.dateEntree), "dd MMM yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right">{lot.quantite.toFixed(2)} kg</TableCell>
                                    <TableCell className="text-right font-semibold text-[#C17A2B]">
                                        {lot.quantiteDisponible.toFixed(2)} kg
                                    </TableCell>
                                </TableRow>
                            ))}

                            {lots.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                                        {chargement ? (
                                            <span className="inline-flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t("common.loading")}
                                            </span>
                                        ) : erreur ? (
                                            <span className="inline-flex flex-wrap items-center justify-center gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <span className="text-red-700">{erreur}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 gap-1.5 rounded-sm border-red-200 text-red-700 hover:bg-red-50"
                                                    onClick={() => setTentative((n) => n + 1)}
                                                >
                                                    <RotateCw className="h-3.5 w-3.5" />
                                                    {t("common.retry")}
                                                </Button>
                                            </span>
                                        ) : (
                                            t("common.noResults")
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {resultat && resultat.totalItems > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-sm text-muted-foreground">
                            {t("common.rangeOfTotal", {
                                start: String(resultat.startIndex),
                                end: String(resultat.endIndex),
                                total: String(resultat.totalItems),
                            })}
                        </p>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#3D1C00]">
                                {t("common.page")} {resultat.currentPage} {t("common.of")} {resultat.totalPages}
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-md border-border p-0"
                                onClick={() => setPage(resultat.currentPage - 1)}
                                disabled={!resultat.hasPreviousPage || chargement}
                            >
                                <span className="sr-only">{t("common.previous")}</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 rounded-md border-border p-0"
                                onClick={() => setPage(resultat.currentPage + 1)}
                                disabled={!resultat.hasNextPage || chargement}
                            >
                                <span className="sr-only">{t("common.next")}</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
