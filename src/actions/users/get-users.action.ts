"use server";

import { userService } from "@/services/user.service";

export async function getUsersAction(options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    active?: boolean;
}) {
    try {
        const result = await userService.getUsers(options);
        return { data: result };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des utilisateurs"
        };
    }
}
