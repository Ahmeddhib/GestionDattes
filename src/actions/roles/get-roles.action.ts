"use server";

import { roleService } from "@/services/role.service";
import { auth } from "@/lib/auth";
import { canViewRoles } from "@/lib/permissions";

export async function getRolesAction() {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canViewRoles(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const roles = await roleService.getAllRoles();
        return { roles };
    } catch (error: any) {
        return { error: error.message };
    }
}
