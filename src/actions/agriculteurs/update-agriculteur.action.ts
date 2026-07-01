"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";
import { updateAgriculteurSchema, type UpdateAgriculteurInput } from "@/validators/agriculteur.validator";

/**
 * Server Action: Mettre à jour un agriculteur
 */
export async function updateAgriculteurAction(data: UpdateAgriculteurInput) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Validation
        const validated = updateAgriculteurSchema.parse(data);

        const agriculteur = await agriculteurService.update(session.user.id, validated);

        return { success: true, data: agriculteur };
    } catch (error: any) {
        console.error("❌ updateAgriculteurAction error:", error);

        if (error.name === "ZodError") {
            return { success: false, error: "Données invalides", details: error.errors };
        }

        return { success: false, error: error.message || "Erreur lors de la mise à jour de l'agriculteur" };
    }
}
