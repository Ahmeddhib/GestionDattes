"use server";

import { deleteRoleValidator } from "@/validators/role.validator";
import { roleService } from "@/services/role.service";
import { revalidatePath } from "next/cache";

export async function deleteRoleAction(id: string) {
    const parsed = deleteRoleValidator.safeParse({ id });

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const data = await roleService.deleteRole(parsed.data.id);
        revalidatePath("/dashboard/roles");
        revalidatePath("/dashboard");
        return { data };
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Erreur lors de la suppression du rôle" };
    }
}
