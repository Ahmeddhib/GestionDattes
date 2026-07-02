"use server";

import { auth } from "@/lib/auth";
import { regionService } from "@/services/region.service";
import { createRegionSchema, type CreateRegionInput } from "@/validators/region.validator";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Server Action: Créer une nouvelle région (MULTI-TENANT)
 */
export async function createRegionAction(data: CreateRegionInput) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session
        const tenantId = await getTenantId();

        // Validation
        const validated = createRegionSchema.parse(data);

        const region = await regionService.create(tenantId, session.user.id, validated);

        return { success: true, data: region };
    } catch (error: any) {
        console.error("❌ createRegionAction error:", error);

        if (error.name === "ZodError") {
            return { success: false, error: "Données invalides", details: error.errors };
        }

        return { success: false, error: error.message || "Erreur lors de la création de la région" };
    }
}
