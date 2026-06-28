import { auth } from "./auth";
import { PERMISSIONS, type Permission } from "@/constants/permissions";

export async function requirePermission(permission: Permission): Promise<void> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Non authentifié");
    }

    const allowedRoles = PERMISSIONS[permission];
    const userRole = session.user.role as string;

    // Debug log
    console.log("🔐 Permission check:", {
        permission,
        userRole,
        allowedRoles,
        isAllowed: allowedRoles.includes(userRole as any),
    });

    if (!allowedRoles.includes(userRole as any)) {
        throw new Error(`Permission refusée: ${permission}. Votre rôle (${userRole}) n'a pas accès.`);
    }
}

export async function hasPermission(permission: Permission): Promise<boolean> {
    try {
        await requirePermission(permission);
        return true;
    } catch {
        return false;
    }
}
