"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";

/**
 * Server Action: Récupérer tous les agriculteurs
 */
export async function getAgricultureursAction() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const agriculteurs = await agriculteurService.getAll(session.user.id);

        return { success: true, data: agriculteurs };
    } catch (error: any) {
        console.error("❌ getAgricultureursAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la récupération des agriculteurs" };
    }
}
