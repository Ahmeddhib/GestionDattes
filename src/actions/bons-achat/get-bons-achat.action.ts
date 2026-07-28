"use server";

import { auth } from "@/lib/auth";
import { bonAchatService } from "@/services/bon-achat.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les bons d'achat (du tenant actuel)
 */
export async function getBonsAchatAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const bonsAchat = await bonAchatService.getAll(tenantId);

        return { success: true, data: bonsAchat };
    } catch (error) {
        console.error("❌ getBonsAchatAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des bons d'achat",
        };
    }
}
