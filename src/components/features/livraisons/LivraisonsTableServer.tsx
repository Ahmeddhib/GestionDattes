"use client";

import { DataTableServer } from "@/components/ui/data-table-server";
import { createLivraisonsColumns, type Livraison } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { PaginatedResult } from "@/lib/pagination";

/**
 * Colonnes cliquables pour trier, et clé de tri envoyée au serveur.
 *
 * Les colonnes absentes de cette table ne sont pas triables : `caisses`,
 * `peseeProgress` et `bonAchat` sont des agrégats calculés à l'affichage, il
 * n'existe aucun `ORDER BY` qui leur corresponde. Les rendre cliquables
 * donnerait un tri silencieusement faux.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    numeroLot: "numeroLot",
    dateLivraison: "dateLivraison",
    agriculteur: "agriculteur",
    quantiteKg: "quantiteLivree",
    quantiteAcceptee: "quantiteAcceptee",
};

export function LivraisonsTableServer({
    resultat,
    canEditAcceptedQuantity,
}: {
    resultat: PaginatedResult<Livraison>;
    canEditAcceptedQuantity: boolean;
}) {
    const { t } = useClientTranslations();

    const columns = createLivraisonsColumns(
        () => {
            // Les dialogues d'édition gèrent leur propre état.
        },
        () => {
            // Idem pour la suppression.
        },
        t,
        canEditAcceptedQuantity
    );

    return (
        <DataTableServer
            columns={columns}
            result={resultat}
            sortableColumns={COLONNES_TRIABLES}
            searchPlaceholder={t("livraisons.searchPlaceholder")}
        />
    );
}
