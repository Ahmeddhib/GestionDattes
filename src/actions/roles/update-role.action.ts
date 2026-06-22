"use server";

import { roleService } from "@/services/role.service";
import { auth } from "@/lib/auth";
import { canManageRoles } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function updateRoleAction(id: string, data: { name?: string; description?: string }) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageRoles(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const updatedRole = await roleService.updateRole(id, data);
        revalidatePath("/dashboard/roles");
        return { success: true, role: updatedRole };
    } catch (error: any) {
        return { error: error.message };
    }
}
