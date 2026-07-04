"use server";

import { auth } from "@/lib/auth";
import { typeCaisseService } from "@/services/type-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les types de caisses (du tenant actuel)
 */
export async function getTypesCaissesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const typesCaisses = await typeCaisseService.getAll(tenantId, session.user.id);

        return { success: true, data: typesCaisses };
    } catch (error) {
        console.error("❌ getTypesCaissesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des types de caisses",
        };
    }
}
