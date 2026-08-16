/**
 * Formatage centralisé pour le dashboard : montants (TND) et quantités (kg).
 * Nouveau fichier, n'affecte pas le formatage ad hoc déjà utilisé ailleurs
 * dans l'app (ex: `${n.toFixed(2)} TND`) — utilisé uniquement par le code
 * du dashboard pour rester cohérent en un seul endroit.
 */

export function formatMontant(n: number): string {
    return `${n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} TND`;
}

export function formatKg(n: number): string {
    return `${n.toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
    })} kg`;
}

export function formatNombre(n: number): string {
    return n.toLocaleString("fr-FR");
}

export interface Evolution {
    value: string;
    isPositive: boolean;
    /** true si la période précédente n'a aucune donnée comparable (évolution non significative) */
    isNew: boolean;
}

/**
 * Évolution en pourcentage entre la valeur courante et celle de la période
 * précédente équivalente. `isPositive` pilote la couleur (vert/rouge) des
 * KpiCard — une hausse n'est pas toujours "positive" métier (ex: dettes
 * agriculteurs qui augmentent), donc l'appelant peut inverser via `invert`.
 */
export function formatEvolution(current: number, previous: number, invert = false): Evolution {
    if (previous === 0) {
        if (current === 0) {
            return { value: "0%", isPositive: true, isNew: false };
        }
        return { value: "Nouveau", isPositive: !invert, isNew: true };
    }

    const pct = ((current - previous) / Math.abs(previous)) * 100;
    const isPositive = invert ? pct <= 0 : pct >= 0;

    return {
        value: `${pct >= 0 ? "+" : ""}${pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%`,
        isPositive,
        isNew: false,
    };
}
