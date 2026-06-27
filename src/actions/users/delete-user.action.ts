"use server";

import { userService } from "@/services/user.service";
import { revalidatePath } from "next/cache";

export async function deleteUserAction(id: string) {
    try {
        const data = await userService.deleteUser(id);
        revalidatePath("/dashboard/users");
        revalidatePath("/dashboard");
        return { data };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur"
        };
    }
}
