"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarRange, ArrowLeft, Lock, FileDown, Printer } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    downloadBilanSaisonPDF,
    printBilanSaisonPDF,
    type BilanSaisonForPdf,
} from "@/lib/bilan-saison-pdf";
import { exportBilanSaisonToExcel } from "@/lib/bilan-saison-excel";

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

interface BilanSaisonData {
    id: string;
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
    clotureeAt: Date | string;
    clotureeParId: string;
}

interface SaisonDetailContentProps {
    saison: {
        id: string;
        nom: string;
        dateDebut: Date | string;
        dateFin: Date | string;
        statut: "OUVERTE" | "CLOTUREE";
        createdAt: Date | string;
    };
    bilan: BilanSaisonData | null;
}

function fmt(n: number) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-4">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{label}</span>
            <span className={highlight ? "font-bold text-[#3D1C00]" : "font-medium text-[#3D1C00]"}>{value}</span>
        </div>
    );
}

export function SaisonDetailContent({ saison, bilan }: SaisonDetailContentProps) {
    const { t } = useClientTranslations();

    const bilanForExport: BilanSaisonForPdf | null = bilan
        ? { ...bilan, clotureeAt: new Date(bilan.clotureeAt) }
        : null;

    return (
        <PageContainer>
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/dashboard/finance/saisons"
                        className="text-sm text-[#C17A2B] flex items-center gap-1 mb-2 hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {t("finance.saisons.cloture.backToList")}
                    </Link>
                    <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                        <CalendarRange className="h-8 w-8 text-[#C17A2B]" />
                        {saison.nom}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge
                            variant={saison.statut === "OUVERTE" ? "default" : "secondary"}
                            className={saison.statut === "OUVERTE" ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {saison.statut === "OUVERTE"
                                ? t("finance.saisons.ouverte")
                                : t("finance.saisons.cloturee")}
                        </Badge>
                        <span className="text-sm text-gray-600">
                            {format(new Date(saison.dateDebut), "dd MMM yyyy", { locale: fr })} —{" "}
                            {format(new Date(saison.dateFin), "dd MMM yyyy", { locale: fr })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {saison.statut === "OUVERTE" && (
                        <Link href={`/dashboard/finance/saisons/${saison.id}/cloture`}>
                            <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-md">
                                <Lock className="mr-2 h-4 w-4" />
                                {t("finance.saisons.cloture.action")}
                            </Button>
                        </Link>
                    )}
                    {bilanForExport && (
                        <>
                            <Button
                                variant="outline"
                                className="rounded-md"
                                onClick={() => downloadBilanSaisonPDF(bilanForExport, saison)}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                {t("common.exportPDF")}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-md"
                                onClick={() => printBilanSaisonPDF(bilanForExport, saison)}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-md"
                                onClick={() => exportBilanSaisonToExcel(bilanForExport, saison)}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                {t("common.exportExcel")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {!bilan ? (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center text-gray-600">
                    {t("finance.saisons.bilan.notAvailable")}
                </div>
            ) : (
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
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                            <p className="text-sm text-gray-600">{t("finance.saisons.bilan.tresorerie")}</p>
                            <p className="text-2xl font-bold text-[#C17A2B] mt-2">{fmt(bilan.tresorerie)} TND</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                            <p className="text-sm text-gray-600">{t("finance.saisons.bilan.margeBrute")}</p>
                            <p className="text-2xl font-bold text-[#3D1C00] mt-2">{fmt(bilan.margeBrute)} TND</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center">
                            <p className="text-sm text-gray-600">{t("finance.saisons.bilan.margeNette")}</p>
                            <p className="text-2xl font-bold text-[#3D1C00] mt-2">{fmt(bilan.margeNette)} TND</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card title={t("finance.saisons.bilan.stockFinal")}>
                            {bilan.stockFinalParTypeDate.length === 0 ? (
                                <p className="text-sm text-gray-500">—</p>
                            ) : (
                                bilan.stockFinalParTypeDate.map((s) => (
                                    <Row key={s.typeDateId} label={s.nom} value={fmt(s.quantiteDisponible)} />
                                ))
                            )}
                        </Card>

                        <Card title={t("finance.saisons.bilan.stockCaisses")}>
                            {bilan.stockCaisses.length === 0 ? (
                                <p className="text-sm text-gray-500">—</p>
                            ) : (
                                bilan.stockCaisses.map((c) => (
                                    <div key={c.typeCaisseId} className="text-sm border-b border-gray-100 pb-2 mb-2 last:border-0">
                                        <p className="font-medium text-[#3D1C00]">{c.nom}</p>
                                        <div className="flex justify-between text-gray-600">
                                            <span>{t("finance.saisons.bilan.caissesPretees")}: {c.nombrePrete}</span>
                                            <span>{t("finance.saisons.bilan.caissesRetournees")}: {c.nombreRetourne}</span>
                                            <span>{t("finance.saisons.bilan.caissesNonRetournees")}: {c.nombreNonRetourne}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </Card>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-2">
                            {t("finance.saisons.bilan.historique")}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {t("finance.saisons.bilan.creeLe")}{" "}
                            {format(new Date(saison.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                        <p className="text-sm text-gray-600">
                            {t("finance.saisons.bilan.clotureeLe")}{" "}
                            {format(new Date(bilan.clotureeAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                        </p>
                    </div>
                </>
            )}
        </PageContainer>
    );
}
