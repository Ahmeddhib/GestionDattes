"use server";

import { updateRoleValidator } from "@/validators/role.validator";
import { roleService } from "@/services/role.service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateRoleActionValidator = z.object({
    id: z.string().cuid(),
    ...updateRoleValidator.shape,
});

export async function updateRoleAction(id: string, formData: unknown) {
    const dataWithId = { id, ...formData as object };
    const parsed = updateRoleActionValidator.safeParse(dataWithId);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const { id: roleId, ...data } = parsed.data;
        const result = await roleService.updateRole(roleId, data);
        revalidatePath("/dashboard/roles");
        revalidatePath("/dashboard");
        return { data: result };
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Erreur lors de la modification du rôle" };
    }
}
