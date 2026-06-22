"use server";

import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";

export async function getUserAction(id: string) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    try {
        const user = await userService.getUserById(id);
        if (!user) {
            return { error: "Utilisateur non trouvé" };
        }
        return { user };
    } catch (error: any) {
        return { error: error.message };
    }
}
