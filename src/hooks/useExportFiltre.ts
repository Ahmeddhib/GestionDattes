"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type ResultatExport<T> =
    | { success: true; data: T[] }
    | { success: false; error: string };

/**
 * Filtres relus depuis l'URL et transmis à l'action d'export.
 *
 * Volontairement une union de toutes les clés utilisées par les modules plutôt
 * qu'un type par module : chaque action ne déclare que ce qu'elle sait lire et
 * ignore le reste. Un module qui gagne un filtre n'a ainsi qu'à l'ajouter ici,
 * sans risque d'oublier de le propager à son export — c'est exactement l'oubli
 * qui ferait exporter un jeu plus large que celui affiché.
 */
export interface ParamsExportFiltre {
    search: string;
    saisonId?: string;
    clientId?: string;
    agriculteurId?: string;
    typeCaisseId?: string;
    statut?: string;
    from?: string;
    to?: string;
}

/**
 * Recharge TOUTES les lignes du filtre courant, puis les remet à une fonction
 * d'export.
 *
 * Indispensable depuis la pagination serveur : la page ne détient plus qu'une
 * tranche, et exporter ce qu'elle a produirait un fichier de dix lignes
 * présenté comme l'export complet — une erreur silencieuse.
 *
 * Les filtres sont relus depuis l'URL, seule source de vérité ; le `saisonId`
 * est revalidé côté serveur contre le tenant.
 */
export function useExportFiltre<T>(
    action: (params: ParamsExportFiltre) => Promise<ResultatExport<T>>
) {
    const searchParams = useSearchParams();
    const { t } = useClientTranslations();
    const [enCours, setEnCours] = useState(false);

    async function exporter(ecrire: (lignes: T[]) => void | Promise<void>) {
        setEnCours(true);
        try {
            const lire = (cle: string) => searchParams.get(cle) ?? undefined;
            const resultat = await action({
                search: searchParams.get("search") ?? "",
                saisonId: lire("saisonId"),
                clientId: lire("clientId"),
                agriculteurId: lire("agriculteurId"),
                typeCaisseId: lire("typeCaisseId"),
                statut: lire("statut"),
                from: lire("from"),
                to: lire("to"),
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
