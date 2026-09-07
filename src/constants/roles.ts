export const ROLES = {
    ADMIN: "ADMIN",
    USER: "USER",
    AGENT: "AGENT",
    LABORANTIN: "LABORANTIN",
    RESPONSABLE_STOCK: "RESPONSABLE_STOCK",
    DIRECTION: "DIRECTION",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
