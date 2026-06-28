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

    // Audit
    "audit:read": [ROLES.ADMIN, ROLES.DIRECTION],
} as const;

export type Permission = keyof typeof PERMISSIONS;
