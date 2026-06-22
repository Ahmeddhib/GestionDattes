export const ROLES = {
    ADMIN: "ADMIN",
    AGENT: "AGENT",
    LABORANTIN: "LABORANTIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function canManageUsers(role: string): boolean {
    return role === ROLES.ADMIN;
}

export function canViewUsers(role: string): boolean {
    return role === ROLES.ADMIN;
}

export function canEditUser(role: string, targetRole: string): boolean {
    if (role === ROLES.ADMIN) return true;
    return false;
}

export function canManageRoles(role: string): boolean {
    return role === ROLES.ADMIN;
}

export function canViewRoles(role: string): boolean {
    return role === ROLES.ADMIN;
}
