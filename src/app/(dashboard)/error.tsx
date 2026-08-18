"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientTranslations } from "@/hooks/useClientTranslations";

/**
 * Frontière d'erreur du tableau de bord.
 *
 * Elle existe pour deux raisons précises :
 *
 * 1. Sans elle, la moindre panne de chargement remontait à `src/app/error.tsx`,
 *    qui remplace la page ENTIÈRE — barre latérale comprise. Une base
 *    momentanément injoignable donnait donc l'impression que l'application était
 *    morte. Ici, seul le contenu est remplacé : la navigation reste utilisable.
 *
 * 2. Plusieurs pages lèvent une erreur quand leur chargement échoue, et certains
 *    appels de service ne passent pas par une Server Action — une erreur brute de
 *    l'adaptateur Neon s'affichait alors telle quelle, en « [object Object] ».
 *
 * `reset()` relance le rendu du segment : c'est exactement ce qu'il faut pour une
 * panne transitoire, sans recharger l'application ni perdre la session.
 */
export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { t } = useClientTranslations();

    useEffect(() => {
        console.error("❌ dashboard error:", error);
    }, [error]);

    // En production Next masque le message des Server Components ; et un objet
    // non-`Error` se sérialise en « [object Object] ». Dans les deux cas, un
    // message générique traduit vaut mieux qu'un texte inutile.
    const message =
        error.message && !error.message.includes("[object") && error.message !== "Erreur inconnue"
            ? error.message
            : t("messages.error.generic");

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-red-100">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                    {t("messages.error.generic")}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">{message}</p>
                <Button
                    type="button"
                    onClick={reset}
                    className="gap-2 rounded-md bg-[#C17A2B] text-white hover:bg-[#A6631F]"
                >
                    <RotateCw className="h-4 w-4" />
                    {t("common.retry")}
                </Button>
            </div>
        </div>
    );
}
