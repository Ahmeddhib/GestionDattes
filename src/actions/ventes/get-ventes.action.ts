"use server";

import { auth } from "@/lib/auth";
import { venteService } from "@/services/vente.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer toutes les ventes
 */
export async function getVentesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const ventes = await venteService.getAll(tenantId);

        return { success: true, data: ventes };
    } catch (error) {
        console.error("❌ getVentesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
