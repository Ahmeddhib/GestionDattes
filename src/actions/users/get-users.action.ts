"use server";

import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { canViewUsers } from "@/lib/permissions";

export async function getUsersAction() {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canViewUsers(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const users = await userService.getAllUsers();
        return { users };
    } catch (error: any) {
        return { error: error.message };
    }
}
