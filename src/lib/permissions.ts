import { auth } from "./auth";
import { PERMISSIONS, type Permission } from "@/constants/permissions";

export async function requirePermission(permission: Permission): Promise<void> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Non authentifié");
    }

    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles.includes(session.user.role as any)) {
        throw new Error(`Permission refusée: ${permission}`);
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
