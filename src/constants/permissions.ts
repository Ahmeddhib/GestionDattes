import { ROLES } from "./roles";

export const PERMISSIONS = {
    // Users
    "users:read": [ROLES.ADMIN, ROLES.DIRECTION],
    "users:create": [ROLES.ADMIN],
    "users:update": [ROLES.ADMIN],
    "users:delete": [ROLES.ADMIN],

    // Roles
    "roles:read": [ROLES.ADMIN, ROLES.DIRECTION],
    "roles:create": [ROLES.ADMIN],
    "roles:update": [ROLES.ADMIN],
    "roles:delete": [ROLES.ADMIN],

    // Regions
    "region:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.LABORANTIN, ROLES.RESPONSABLE_STOCK, ROLES.DIRECTION],
    "region:create": [ROLES.ADMIN],
    "region:update": [ROLES.ADMIN],
    "region:delete": [ROLES.ADMIN],

    // Agriculteurs
    "agriculteur:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK, ROLES.DIRECTION],
    "agriculteur:create": [ROLES.ADMIN, ROLES.AGENT],
    "agriculteur:update": [ROLES.ADMIN, ROLES.AGENT],
    "agriculteur:delete": [ROLES.ADMIN],

    // Types de Caisses
    "type-caisse:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK, ROLES.DIRECTION],
    "type-caisse:create": [ROLES.ADMIN, ROLES.RESPONSABLE_STOCK],
    "type-caisse:update": [ROLES.ADMIN, ROLES.RESPONSABLE_STOCK],
    "type-caisse:delete": [ROLES.ADMIN],

    // Types de Dattes
    "types_dates:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK, ROLES.LABORANTIN, ROLES.DIRECTION],
    "types_dates:create": [ROLES.ADMIN, ROLES.RESPONSABLE_STOCK],
    "types_dates:update": [ROLES.ADMIN, ROLES.RESPONSABLE_STOCK],
    "types_dates:delete": [ROLES.ADMIN],

    // Livraisons
    "livraison:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK, ROLES.LABORANTIN, ROLES.DIRECTION],
    "livraison:create": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK],
    "livraison:update": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK],
    "livraison:delete": [ROLES.ADMIN],

    // Prêts de Caisses
    "pret-caisse:read": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK, ROLES.DIRECTION],
    "pret-caisse:create": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK],
    "pret-caisse:update": [ROLES.ADMIN, ROLES.AGENT, ROLES.RESPONSABLE_STOCK],

    // Audit
    "audit:read": [ROLES.ADMIN, ROLES.DIRECTION],
} as const;

export type Permission = keyof typeof PERMISSIONS;
