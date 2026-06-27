export const ROUTES = {
    LOGIN: "/login",
    DASHBOARD: "/dashboard",
    USERS: "/dashboard/users",
    USER: (id: string) => `/dashboard/users/${id}`,
    ROLES: "/dashboard/roles",
    ROLE: (id: string) => `/dashboard/roles/${id}`,
    AUDIT_LOGS: "/dashboard/audit-logs",
    UNAUTHORIZED: "/unauthorized",
} as const;
