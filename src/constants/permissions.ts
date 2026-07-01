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

    // Audit
    "audit:read": [ROLES.ADMIN, ROLES.DIRECTION],
} as const;

export type Permission = keyof typeof PERMISSIONS;
