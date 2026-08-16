/**
 * Palette catégorielle validée (voir skill dataviz — les 4 premiers slots de
 * la palette de référence, qui passent tous les contrôles CVD/contraste en
 * mode clair ET sombre). Ordre fixe : ne jamais réordonner ni faire tourner
 * les teintes selon les séries affichées — l'identité suit toujours la même
 * teinte pour la même série.
 */
export const CHART_COLORS = {
    blue: { light: "#2a78d6", dark: "#3987e5" },
    orange: { light: "#eb6834", dark: "#d95926" },
    aqua: { light: "#1baf7a", dark: "#199e70" },
    yellow: { light: "#eda100", dark: "#c98500" },
} as const;

/** Statuts réservés (jamais réutilisés comme couleur de série). */
export const STATUS_COLORS = {
    good: { light: "#0ca30c", dark: "#0ca30c" },
    warning: { light: "#fab219", dark: "#fab219" },
    serious: { light: "#ec835a", dark: "#ec835a" },
    critical: { light: "#d03b3b", dark: "#d03b3b" },
} as const;

export const CHART_NEUTRAL = { light: "#c3c2b7", dark: "#52514e" };

export const CHART_INK = {
    primary: { light: "#2C1A00", dark: "#F5E6C8" },
    secondary: { light: "#7A5C3A", dark: "#B08A5E" },
    grid: { light: "#F0E0C0", dark: "#3D1C00" },
};
