"use server";

import { roleService } from "@/services/role.service";

export async function getRolesAction(options?: { page?: number; pageSize?: number; search?: string }) {
    try {
        const data = await roleService.getRoles(options);
        return { data };
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Erreur lors de la récupération des rôles" };
    }
}
