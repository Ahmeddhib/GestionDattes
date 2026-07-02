"use server";

import { auth } from "@/lib/auth";
import { regionService } from "@/services/region.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Server Action: Supprimer une région (MULTI-TENANT)
 */
export async function deleteRegionAction(regionId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session
        const tenantId = await getTenantId();

        await regionService.delete(tenantId, session.user.id, regionId);

        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteRegionAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la suppression de la région" };
    }
}
