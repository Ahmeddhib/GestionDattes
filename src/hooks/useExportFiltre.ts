"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type ResultatExport<T> =
    | { success: true; data: T[] }
    | { success: false; error: string };

/**
 * Recharge TOUTES les lignes du filtre courant, puis les remet à une fonction
 * d'export.
 *
 * Indispensable depuis la pagination serveur : la page ne détient plus qu'une
 * tranche, et exporter ce qu'elle a produirait un fichier de dix lignes
 * présenté comme l'export complet — une erreur silencieuse.
 *
 * La recherche et la saison sont relues depuis l'URL, seule source de vérité du
 * filtre ; le `saisonId` est revalidé côté serveur contre le tenant.
 */
export function useExportFiltre<T>(
    action: (params: { search: string; saisonId?: string }) => Promise<ResultatExport<T>>
) {
    const searchParams = useSearchParams();
    const { t } = useClientTranslations();
    const [enCours, setEnCours] = useState(false);

    async function exporter(ecrire: (lignes: T[]) => void | Promise<void>) {
        setEnCours(true);
        try {
            const resultat = await action({
                search: searchParams.get("search") ?? "",
                saisonId: searchParams.get("saisonId") ?? undefined,
            });

            if (!resultat.success) {
                toast.error(resultat.error || t("messages.error.generic"));
                return;
            }
            if (resultat.data.length === 0) {
                toast.info(t("common.noResults"));
                return;
            }

            await ecrire(resultat.data);
        } catch (error) {
            console.error("❌ export error:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setEnCours(false);
        }
    }

    return { exporter, enCours };
}
