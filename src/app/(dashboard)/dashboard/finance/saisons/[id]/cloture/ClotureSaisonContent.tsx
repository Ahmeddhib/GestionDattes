"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
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
import { cloturerSaisonAction } from "@/actions/saisons/cloturer-saison.action";

interface AperçuCloture {
    saison: { id: string; nom: string; dateDebut: string | Date; dateFin: string | Date; statut: string };
    indicateurs: {
        soldeAgriculteursRestant: number;
        creancesClientsRestantes: number;
        stockCaisses: { nom: string; nombreNonRetourne: number }[];
        stockFinalParTypeDate: { nom: string; quantiteDisponible: number }[];
    };
    blockers: { code: string; message: string }[];
}

function fmt(n: number) {
    return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ClotureSaisonContent({ apercu }: { apercu: AperçuCloture }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const { saison, indicateurs, blockers } = apercu;
    const canCloturer = blockers.length === 0;

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            const result = await cloturerSaisonAction(saison.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("finance.saisons.cloture.successToast"));
            router.push(`/dashboard/finance/saisons/${saison.id}`);
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
                    href={`/dashboard/finance/saisons/${saison.id}`}
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

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-4 flex items-center gap-2">
                    {blockers.length > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                    {t("finance.saisons.cloture.blockersTitle")}
                </h3>
                {blockers.length === 0 ? (
                    <p className="text-sm text-green-700">{t("finance.saisons.cloture.noBlockers")}</p>
                ) : (
                    <ul className="space-y-1">
                        {blockers.map((b) => (
                            <li key={b.code} className="text-sm text-red-700">
                                • {b.message}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#3D1C00] uppercase tracking-wide mb-4">
                    {t("finance.saisons.cloture.infoTitle")}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                        <span className="text-gray-600">{t("finance.saisons.cloture.dettesAgriculteurs")}</span>
                        <span className="font-medium text-[#3D1C00]">{fmt(indicateurs.soldeAgriculteursRestant)} TND</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                        <span className="text-gray-600">{t("finance.saisons.cloture.creancesClients")}</span>
                        <span className="font-medium text-[#3D1C00]">{fmt(indicateurs.creancesClientsRestantes)} TND</span>
                    </div>
                </div>

                {indicateurs.stockCaisses.some((c) => c.nombreNonRetourne > 0) && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">{t("finance.saisons.cloture.caissesNonRetournees")}</p>
                        <div className="space-y-1">
                            {indicateurs.stockCaisses
                                .filter((c) => c.nombreNonRetourne > 0)
                                .map((c) => (
                                    <div key={c.nom} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">{c.nom}</span>
                                        <span className="font-medium text-[#3D1C00]">{c.nombreNonRetourne}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {indicateurs.stockFinalParTypeDate.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">{t("finance.saisons.cloture.stockRestant")}</p>
                        <div className="space-y-1">
                            {indicateurs.stockFinalParTypeDate.map((s) => (
                                <div key={s.nom} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{s.nom}</span>
                                    <span className="font-medium text-[#3D1C00]">{fmt(s.quantiteDisponible)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
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
