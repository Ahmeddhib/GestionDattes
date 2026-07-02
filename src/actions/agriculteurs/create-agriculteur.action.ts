"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";
import { createAgriculteurSchema, type CreateAgriculteurInput } from "@/validators/agriculteur.validator";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Server Action: Créer un nouvel agriculteur (MULTI-TENANT)
 */
export async function createAgriculteurAction(data: CreateAgriculteurInput) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session
        const tenantId = await getTenantId();

        // Validation
        const validated = createAgriculteurSchema.parse(data);

        const agriculteur = await agriculteurService.create(tenantId, session.user.id, validated);

        return { success: true, data: agriculteur };
    } catch (error: any) {
        console.error("❌ createAgriculteurAction error:", error);

        if (error.name === "ZodError") {
            return { success: false, error: "Données invalides", details: error.errors };
        }

        return { success: false, error: error.message || "Erreur lors de la création de l'agriculteur" };
    }
}
