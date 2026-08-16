"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Lock, XCircle } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ROUTES } from "@/lib/routes";
import { cloturerSaisonAction } from "@/actions/saisons/cloturer-saison.action";

interface ChecklistItem {
    code: string;
    severity: "BLOCKING" | "WARNING";
    count?: number;
    valeur?: string;
    href?: string;
}

interface AperçuCloture {
    saison: { id: string; nom: string; dateDebut: string | Date; dateFin: string | Date; statut: string };
    indicateurs: {
        soldeAgriculteursRestant: number;
        creancesClientsRestantes: number;
        stockCaisses: { nom: string; nombreNonRetourne: number }[];
        stockFinalParTypeDate: { nom: string; quantiteDisponible: number }[];
    };
    blockers: ChecklistItem[];
    warnings: ChecklistItem[];
}

export function ClotureSaisonContent({ apercu }: { apercu: AperçuCloture }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [acquitte, setAcquitte] = useState(false);

    const { saison, blockers, warnings } = apercu;

    // Seuls les bloquants empêchent la clôture. Les avertissements exigent
    // simplement un acquittement explicite : c'est au propriétaire de décider
    // que la campagne est terminée.
    const canCloturer = blockers.length === 0 && acquitte;

    // Les messages sont paramétrés par {count} ou {valeur} selon le contrôle.
    function messageDe(item: ChecklistItem) {
        return t(`finance.saisons.cloture.checks.${item.code}`, {
            count: String(item.count ?? ""),
            valeur: item.valeur ?? "",
        });
    }

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            const result = await cloturerSaisonAction(saison.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("finance.saisons.cloture.successToast"));

            if (result.data?.prochaineSaisonRequise) {
                // Aucune saison n'est ouverte : plus aucune opération n'est
                // possible tant qu'un ADMIN n'en a pas créé une.
                toast.warning(t("finance.saisons.cloture.prochaineSaison"), { duration: 10000 });
            }

            router.push(ROUTES.SAISON(saison.id));
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <div>
                <Link
                    href={ROUTES.SAISON(saison.id)}
                    className="text-sm text-[#C17A2B] flex items-center gap-1 mb-2 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("finance.saisons.cloture.backToList")}
                </Link>
                <h1 className="text-3xl font-bold text-[#3D1C00] flex items-center gap-3">
                    <Lock className="h-8 w-8 text-amber-700" />
                    {t("finance.saisons.cloture.title")}
                </h1>
                <p className="text-gray-600 mt-2">
                    {saison.nom} — {t("finance.saisons.cloture.subtitle")}
                </p>
            </div>

            {/* Points bloquants : empêchent réellement la clôture. */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-1 flex items-center gap-2">
                    {blockers.length > 0 ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {t("finance.saisons.cloture.blockersTitle")}
                </h3>

                {blockers.length === 0 ? (
                    <p className="text-sm text-green-700 mt-3">
                        {t("finance.saisons.cloture.noBlockers")}
                    </p>
                ) : (
                    <>
                        <p className="text-xs text-gray-500 mb-3">
                            {t("finance.saisons.cloture.blockersDescription")}
                        </p>
                        <ul className="space-y-2">
                            {blockers.map((b) => (
                                <li
                                    key={b.code}
                                    className="flex items-center justify-between gap-4 text-sm rounded-md border border-red-200 bg-red-50 px-3 py-2"
                                >
                                    <span className="text-red-800">{messageDe(b)}</span>
                                    {b.href && (
                                        <Link
                                            href={b.href}
                                            className="shrink-0 font-medium text-red-700 underline"
                                        >
                                            {t("finance.saisons.cloture.corriger")}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            {/* Avertissements : informatifs, ne bloquent jamais. */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    {t("finance.saisons.cloture.warningsTitle")}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                    {t("finance.saisons.cloture.warningsHint")}
                </p>

                {warnings.length === 0 ? (
                    <p className="text-sm text-gray-600">{t("finance.saisons.cloture.noWarnings")}</p>
                ) : (
                    <ul className="space-y-2">
                        {warnings.map((w) => (
                            <li
                                key={w.code}
                                className="flex items-center justify-between gap-4 text-sm rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                            >
                                <span className="text-amber-900">{messageDe(w)}</span>
                                {w.href && (
                                    <Link
                                        href={w.href}
                                        className="shrink-0 font-medium text-amber-800 underline"
                                    >
                                        {t("common.view")}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex items-center justify-between gap-6 flex-wrap">
                <label className="flex items-start gap-3 text-sm text-[#3D1C00] max-w-2xl cursor-pointer">
                    <Checkbox
                        checked={acquitte}
                        onCheckedChange={(v) => setAcquitte(v === true)}
                        disabled={blockers.length > 0}
                        className="mt-0.5"
                    />
                    <span>{t("finance.saisons.cloture.acknowledge")}</span>
                </label>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            disabled={!canCloturer || isLoading}
                            className="bg-amber-700 hover:bg-amber-800 text-white rounded-md"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Lock className="mr-2 h-4 w-4" />
                            {t("finance.saisons.cloture.confirmButton")}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t("finance.saisons.cloture.confirmTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t("finance.saisons.cloture.confirmMessage")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirm}
                                className="bg-amber-700 hover:bg-amber-800 text-white"
                            >
                                {t("finance.saisons.cloture.confirmButton")}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageContainer>
    );
}
