"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";

/**
 * Server Action: Supprimer un agriculteur
 */
export async function deleteAgriculteurAction(agriculteurId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        await agriculteurService.delete(session.user.id, agriculteurId);

        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteAgriculteurAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la suppression de l'agriculteur" };
    }
}
