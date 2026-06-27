import { ROLES } from "./roles";

export const PERMISSIONS = {
    // Users
    "users:read": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTEUR],
    "users:create": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "users:update": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "users:delete": [ROLES.SUPER_ADMIN],

    // Roles
    "roles:read": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTEUR],
    "roles:create": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "roles:update": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
    "roles:delete": [ROLES.SUPER_ADMIN],

    // Audit
    "audit:read": [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTEUR],
} as const;

export type Permission = keyof typeof PERMISSIONS;
