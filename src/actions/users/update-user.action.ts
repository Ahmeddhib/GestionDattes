"use server";

import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export async function updateUserAction(
    id: string,
    data: {
        name?: string;
        email?: string;
        password?: string;
        roleId?: string;
    }
) {
    const session = await auth();

    if (!session?.user) {
        return { error: "Non authentifié" };
    }

    if (!canManageUsers(session.user.role)) {
        return { error: "Accès non autorisé" };
    }

    try {
        const user = await userService.updateUser(id, data);
        revalidatePath(ROUTES.USERS);
        revalidatePath(`${ROUTES.USERS}/${id}`);
        return { user, success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
