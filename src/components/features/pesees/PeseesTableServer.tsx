"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";
import { DataTableServer } from "@/components/ui/data-table-server";
import { createColumns, type PeseeGroupee } from "./columns";
import type { PaginatedResult } from "@/lib/pagination";

/**
 * Colonnes triables : celles qui appartiennent à la livraison elle-même.
 *
 * Les poids, le nombre de caisses et le montant sont des sommes de ses pesées,
 * et « Date de pesée » est le maximum de leurs dates — aucun `ORDER BY` Prisma
 * ne les exprime, et les rendre cliquables trierait sur un mauvais critère sans
 * le dire. Chaque clé doit correspondre à un `id` de colonne réel, sinon
 * l'en-tête n'est jamais cliquable et le tri reste inatteignable.
 */
const COLONNES_TRIABLES: Record<string, string> = {
    numeroLot: "numeroLot",
    agriculteur: "agriculteur",
};

export function PeseesTableServer({ resultat }: { resultat: PaginatedResult<PeseeGroupee> }) {
    const { t } = useClientTranslations();
    const columns = createColumns(t);

    return (
        <DataTableServer
            columns={columns}
            result={resultat}
            sortableColumns={COLONNES_TRIABLES}
            searchPlaceholder={t("pesees.searchPlaceholder")}
        />
    );
}
