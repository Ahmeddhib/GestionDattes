"use server";

import { auth } from "@/lib/auth";
import { regionService } from "@/services/region.service";

/**
 * Server Action: Récupérer toutes les régions
 */
export async function getRegionsAction() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const regions = await regionService.getAll(session.user.id);

        return { success: true, data: regions };
    } catch (error: any) {
        console.error("❌ getRegionsAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la récupération des régions" };
    }
}
