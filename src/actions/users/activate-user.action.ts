"use server";

import { userService } from "@/services/user.service";
import { revalidatePath } from "next/cache";

export async function activateUserAction(id: string) {
    try {
        const data = await userService.activateUser(id);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { data };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de l'activation de l'utilisateur"
        };
    }
}
