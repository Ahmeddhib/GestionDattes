"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";

/**
 * Encart affiché sur les pages de saisie quand le tenant n'a aucune saison
 * OUVERTE — situation normale entre une clôture et la création manuelle de
 * la saison suivante. Les boutons de création sont désactivés en parallèle ;
 * le vrai blocage reste côté serveur (`getSaisonOuverte`).
 */
export function AucuneSaisonAlert({ canGererSaisons = false }: { canGererSaisons?: boolean }) {
    const { t } = useClientTranslations();

    return (
        <Alert variant="destructive" className="bg-red-50/60">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("finance.saisons.aucuneSaison.title")}</AlertTitle>
            <AlertDescription className="text-red-700">
                {t("finance.saisons.aucuneSaison.message")}
                {canGererSaisons && (
                    <>
                        {" "}
                        <Link href={ROUTES.SAISONS} className="font-medium underline">
                            {t("finance.saisons.aucuneSaison.cta")}
                        </Link>
                    </>
                )}
            </AlertDescription>
        </Alert>
    );
}
