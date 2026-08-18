"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileDown, Printer } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    downloadBilanSaisonPDF,
    printBilanSaisonPDF,
    type BilanSaisonForPdf,
} from "@/lib/bilan-saison-pdf";
import { exportBilanSaisonToExcel } from "@/lib/bilan-saison-excel";
import type { PdfBranding } from "@/lib/pdf-branding";

interface StockFinalTypeDate {
    typeDateId: string;
    nom: string;
    quantiteDisponible: number;
}

interface StockCaisseType {
    typeCaisseId: string;
    nom: string;
    nombrePrete: number;
    nombreRetourne: number;
    nombreNonRetourne: number;
}

export interface BilanSaisonData {
    id: string;
    type: "PROVISOIRE" | "FINAL";
    version: number;
    nombreLivraisons: number;
    totalQuantiteLivree: number;
    totalQuantiteAcceptee: number;
    totalAchatsMontant: number;
    quantitePayable: number;
    totalPaiementsAgriculteurs: number;
    soldeAgriculteursRestant: number;
    totalVentesQuantite: number;
    chiffreAffairesVentes: number;
    totalEncaissements: number;
    creancesClientsRestantes: number;
    totalDepensesAutres: number;
    tresorerie: number;
    margeBrute: number;
    margeNette: number;
    stockFinalParTypeDate: StockFinalTypeDate[];
    stockCaisses: StockCaisseType[];
    stockEntreParTypeDate: StockFinalTypeDate[];
    stockOrigineRestantParTypeDate: StockFinalTypeDate[];
    caissesSaison: StockCaisseType[];
    genereAt: Date | string;
    genereParNom: string | null;
}

interface SaisonDetailContentProps {
    saison: {
        id: string;
        nom: string;
        dateDebut: Date | string;
        dateFin: Date | string;
        statut: "OUVERTE" | "CLOTUREE";
        createdAt: Date | string;
        clotureeAt?: Date | string | null;
    };
    bilans: BilanSaisonData[];
    branding: PdfBranding;
}

function fmt(n: number) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Card({
    title,
    hint,
    children,
}: {
    title: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
            {hint && <p className="text-xs text-muted-foreground mt-1 mb-3">{hint}</p>}
            <div className={hint ? "space-y-2" : "space-y-2 mt-4"}>{children}</div>
        </div>
    );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className={highlight ? "font-bold text-foreground" : "font-medium text-foreground"}>
                {value}
            </span>
        </div>
    );
}

/**
 * Panneau « Aperçu » du détail d'une saison : sélecteur de version, exports et
 * indicateurs figés du bilan sélectionné.
 *
 * ⚠️ Le composant est monté avec une `key` portant l'identifiant du bilan le
 * plus récent (voir `page.tsx`). Générer un bilan provisoire depuis l'en-tête
 * le remonte donc, et la sélection se réinitialise sur la nouvelle version —
 * sans quoi l'utilisateur resterait sur l'ancienne après avoir cliqué.
 */
export function SaisonDetailContent({
    saison,
    bilans,
    branding,
}: SaisonDetailContentProps) {
    const { t } = useClientTranslations();

    // Les bilans arrivent triés du plus récent au plus ancien : le premier est
    // donc le bilan final si la saison est clôturée, sinon le dernier provisoire.
    const [selectedId, setSelectedId] = useState<string | null>(bilans[0]?.id ?? null);
    const bilan = bilans.find((b) => b.id === selectedId) ?? bilans[0] ?? null;

    const bilanForExport: BilanSaisonForPdf | null = bilan
        ? { ...bilan, genereAt: new Date(bilan.genereAt) }
        : null;

    function libelleBilan(b: BilanSaisonData) {
        const nature =
            b.type === "FINAL"
                ? t("finance.saisons.provisoire.badgeFinal")
                : `${t("finance.saisons.provisoire.badge")} v${b.version}`;
        return `${nature} — ${format(new Date(b.genereAt), "dd MMM yyyy HH:mm", { locale: fr })}`;
    }

    return (
        <div className="space-y-6">
            {bilans.length === 0 ? (
                <div className="bg-card rounded-lg border border-border shadow-sm p-10 text-center text-muted-foreground">
                    {t("finance.saisons.provisoire.aucun")}
                </div>
            ) : (
                <>
                    <div className="bg-card rounded-lg border border-border shadow-sm p-4 flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {t("finance.saisons.provisoire.selectVersion")}
                            </span>
                            <Select value={bilan?.id} onValueChange={setSelectedId}>
                                <SelectTrigger className="w-80">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {bilans.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {libelleBilan(b)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {bilan && (
                            <Badge
                                variant={bilan.type === "FINAL" ? "default" : "secondary"}
                                className={
                                    bilan.type === "FINAL"
                                        ? "bg-[#C17A2B] hover:bg-[#A0621F]"
                                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                }
                            >
                                {bilan.type === "FINAL"
                                    ? t("finance.saisons.provisoire.badgeFinal")
                                    : t("finance.saisons.provisoire.badge")}
                            </Badge>
                        )}

                        {bilanForExport && (
                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    variant="outline"
                                    className="rounded-md"
                                    onClick={() => void downloadBilanSaisonPDF(bilanForExport, saison, branding)}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    {t("common.exportPDF")}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-md"
                                    onClick={() => void printBilanSaisonPDF(bilanForExport, saison, branding)}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="rounded-md"
                                    onClick={() => exportBilanSaisonToExcel(bilanForExport, saison)}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    {t("common.exportExcel")}
                                </Button>
                            </div>
                        )}
                    </div>

                    {bilan && (
                        <>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                <Card title={t("finance.saisons.bilan.livraisons")}>
                                    <Row label={t("finance.saisons.bilan.nombreLivraisons")} value={`${bilan.nombreLivraisons}`} />
                                    <Row label={t("finance.saisons.bilan.quantiteLivree")} value={fmt(bilan.totalQuantiteLivree)} />
                                    <Row label={t("finance.saisons.bilan.quantiteAcceptee")} value={fmt(bilan.totalQuantiteAcceptee)} />
                                </Card>

                                <Card title={t("finance.saisons.bilan.achats")}>
                                    <Row label={t("finance.saisons.bilan.totalAchats")} value={`${fmt(bilan.totalAchatsMontant)} TND`} />
                                    <Row label={t("finance.saisons.bilan.quantitePayable")} value={fmt(bilan.quantitePayable)} />
                                </Card>

                                <Card title={t("finance.saisons.bilan.paiementsAgriculteurs")}>
                                    <Row label={t("finance.saisons.bilan.totalPaiements")} value={`${fmt(bilan.totalPaiementsAgriculteurs)} TND`} />
                                    <Row label={t("finance.saisons.bilan.soldeRestant")} value={`${fmt(bilan.soldeAgriculteursRestant)} TND`} highlight />
                                </Card>

                                <Card title={t("finance.saisons.bilan.ventes")}>
                                    <Row label={t("finance.saisons.bilan.quantiteVendue")} value={fmt(bilan.totalVentesQuantite)} />
                                    <Row label={t("finance.saisons.bilan.chiffreAffaires")} value={`${fmt(bilan.chiffreAffairesVentes)} TND`} highlight />
                                </Card>

                                <Card title={t("finance.saisons.bilan.encaissements")}>
                                    <Row label={t("finance.saisons.bilan.totalEncaissements")} value={`${fmt(bilan.totalEncaissements)} TND`} />
                                    <Row label={t("finance.saisons.bilan.creancesRestantes")} value={`${fmt(bilan.creancesClientsRestantes)} TND`} highlight />
                                </Card>

                                <Card title={t("finance.saisons.bilan.depenses")}>
                                    <Row label={t("finance.saisons.bilan.totalDepenses")} value={`${fmt(bilan.totalDepensesAutres)} TND`} />
                                </Card>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="bg-card rounded-lg border border-border shadow-sm p-6 text-center">
                                    <p className="text-sm text-muted-foreground">{t("finance.saisons.bilan.tresorerie")}</p>
                                    <p className="text-2xl font-bold text-[#C17A2B] mt-2">{fmt(bilan.tresorerie)} TND</p>
                                </div>
                                <div className="bg-card rounded-lg border border-border shadow-sm p-6 text-center">
                                    <p className="text-sm text-muted-foreground">{t("finance.saisons.bilan.margeBrute")}</p>
                                    <p className="text-2xl font-bold text-foreground mt-2">{fmt(bilan.margeBrute)} TND</p>
                                </div>
                                <div className="bg-card rounded-lg border border-border shadow-sm p-6 text-center">
                                    <p className="text-sm text-muted-foreground">{t("finance.saisons.bilan.margeNette")}</p>
                                    <p className="text-2xl font-bold text-foreground mt-2">{fmt(bilan.margeNette)} TND</p>
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <Card
                                    title={t("finance.saisons.bilan.stockFinal")}
                                    hint={t("finance.saisons.bilan.stockFinalHint")}
                                >
                                    {bilan.stockFinalParTypeDate.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    ) : (
                                        bilan.stockFinalParTypeDate.map((s) => (
                                            <Row key={s.typeDateId} label={s.nom} value={fmt(s.quantiteDisponible)} />
                                        ))
                                    )}
                                </Card>

                                <Card
                                    title={t("finance.saisons.bilan.stockEntre")}
                                    hint={t("finance.saisons.bilan.stockOrigineRestant")}
                                >
                                    {bilan.stockEntreParTypeDate.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    ) : (
                                        bilan.stockEntreParTypeDate.map((s) => {
                                            const restant = bilan.stockOrigineRestantParTypeDate.find(
                                                (r) => r.typeDateId === s.typeDateId
                                            );
                                            return (
                                                <Row
                                                    key={s.typeDateId}
                                                    label={s.nom}
                                                    value={`${fmt(s.quantiteDisponible)} → ${fmt(restant?.quantiteDisponible ?? 0)}`}
                                                />
                                            );
                                        })
                                    )}
                                </Card>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <Card title={t("finance.saisons.bilan.stockCaisses")}>
                                    {bilan.stockCaisses.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    ) : (
                                        bilan.stockCaisses.map((c) => (
                                            <div key={c.typeCaisseId} className="text-sm border-b border-gray-100 pb-2 mb-2 last:border-0">
                                                <p className="font-medium text-foreground">{c.nom}</p>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>{t("finance.saisons.bilan.caissesPretees")}: {c.nombrePrete}</span>
                                                    <span>{t("finance.saisons.bilan.caissesRetournees")}: {c.nombreRetourne}</span>
                                                    <span>{t("finance.saisons.bilan.caissesNonRetournees")}: {c.nombreNonRetourne}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card>

                                <Card title={t("finance.saisons.bilan.caissesSaison")}>
                                    {bilan.caissesSaison.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">—</p>
                                    ) : (
                                        bilan.caissesSaison.map((c) => (
                                            <div key={c.typeCaisseId} className="text-sm border-b border-gray-100 pb-2 mb-2 last:border-0">
                                                <p className="font-medium text-foreground">{c.nom}</p>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>{t("finance.saisons.bilan.caissesPretees")}: {c.nombrePrete}</span>
                                                    <span>{t("finance.saisons.bilan.caissesRetournees")}: {c.nombreRetourne}</span>
                                                    <span>{t("finance.saisons.bilan.caissesNonRetournees")}: {c.nombreNonRetourne}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </Card>
                            </div>

                            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
                                    {t("finance.saisons.bilan.historique")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {t("finance.saisons.bilan.creeLe")}{" "}
                                    {format(new Date(saison.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t("finance.saisons.provisoire.genereLe")}{" "}
                                    {format(new Date(bilan.genereAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                    {bilan.genereParNom && (
                                        <> {t("finance.saisons.provisoire.genereePar")} {bilan.genereParNom}</>
                                    )}
                                </p>
                                {saison.clotureeAt && (
                                    <p className="text-sm text-muted-foreground">
                                        {t("finance.saisons.bilan.clotureeLe")}{" "}
                                        {format(new Date(saison.clotureeAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
