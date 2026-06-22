"use server";

import { roleService } from "@/services/role.service";
import { auth } from "@/lib/auth";
import { canManageRoles } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createRoleAction(data: { name: string; description?: string }) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageRoles(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const newRole = await roleService.createRole(data);
        revalidatePath("/dashboard/roles");
        return { success: true, role: newRole };
    } catch (error: any) {
        return { error: error.message };
    }
}
