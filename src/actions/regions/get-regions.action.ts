"use server";

import { auth } from "@/lib/auth";
import { regionService } from "@/services/region.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { unstable_rethrow } from "next/navigation";

/**
 * Server Action: Récupérer toutes les régions (MULTI-TENANT)
 * Filtre automatiquement par tenantId depuis la session
 */
export async function getRegionsAction() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session (jamais du client)
        const tenantId = await getTenantId();

        const regions = await regionService.getAll(tenantId, session.user.id);

        return { success: true, data: regions };
    } catch (error: unknown) {
        unstable_rethrow(error);
        console.error("❌ getRegionsAction error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la récupération des régions" };
    }
}
