"use server";

import { userService } from "@/services/user.service";
import { updateUserValidator } from "@/validators/user.validator";
import { revalidatePath } from "next/cache";

export async function updateUserAction(id: string, formData: unknown) {
    const parsed = updateUserValidator.safeParse(formData);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const data = await userService.updateUser(id, parsed.data);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { data };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'utilisateur"
        };
    }
}
