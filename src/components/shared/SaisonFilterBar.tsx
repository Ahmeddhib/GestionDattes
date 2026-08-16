"use client";

import { SaisonFilterSelect, type SaisonOption } from "./SaisonFilterSelect";
import { SaisonClotureeBadge } from "./SaisonClotureeBadge";

/**
 * Ce que la page serveur descend à son PageContent après avoir appelé
 * `resolveSaisonFilter`. Regroupé en un seul objet pour qu'ajouter le filtre à
 * une page se réduise à une prop.
 */
export interface SaisonFiltreProps {
    saisons: SaisonOption[];
    /** "courante" | "precedente" | "toutes" | <id> */
    value: string;
    /** Saison clôturée sélectionnée ⇒ consultation et export uniquement. */
    isReadOnly: boolean;
}

export function SaisonFilterBar({ saisons, value, isReadOnly }: SaisonFiltreProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <SaisonFilterSelect saisons={saisons} value={value} />
            {isReadOnly && <SaisonClotureeBadge withHint />}
        </div>
    );
}
