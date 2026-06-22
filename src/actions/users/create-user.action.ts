"use server";

import { userService } from "@/services/user.service";
import { logAction } from "@/services/audit.service";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function createUserAction(data: {
    name: string;
    email: string;
    password: string;
    roleId: string;
}) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageUsers(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const user = await userService.createUser(data);
        await logAction(
            session.user.id,
            user.id,
            "CREATE_USER",
            `Création de l'utilisateur ${user.email}`
        );
        revalidatePath(ROUTES.USERS);
        return { user, success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
