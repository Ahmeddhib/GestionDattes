"use server";

import { createRoleValidator } from "@/validators/role.validator";
import { roleService } from "@/services/role.service";
import { revalidatePath } from "next/cache";

export async function createRoleAction(formData: unknown) {
    const parsed = createRoleValidator.safeParse(formData);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const data = await roleService.createRole(parsed.data);
        revalidatePath("/dashboard/roles");
        revalidatePath("/dashboard");
        return { data };
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Erreur lors de la création du rôle" };
    }
}
