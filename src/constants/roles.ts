export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    DIRECTEUR: "DIRECTEUR",
    GESTIONNAIRE: "GESTIONNAIRE",
    LABORANTIN: "LABORANTIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
