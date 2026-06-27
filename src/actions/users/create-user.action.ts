"use server";

import { userService } from "@/services/user.service";
import { createUserValidator } from "@/validators/user.validator";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: unknown) {
    const parsed = createUserValidator.safeParse(formData);

    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    try {
        const data = await userService.createUser(parsed.data);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { data };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur"
        };
    }
}
