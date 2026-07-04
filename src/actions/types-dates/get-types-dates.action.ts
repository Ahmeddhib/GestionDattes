"use server";

import { auth } from "@/lib/auth";
import { typeDateService } from "@/services/type-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les types de dattes (du tenant actuel)
 */
export async function getTypesDatesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const typesDates = await typeDateService.getAll(tenantId, session.user.id);

        return { success: true, data: typesDates };
    } catch (error) {
        console.error("❌ getTypesDatesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des types de dattes",
        };
    }
}
