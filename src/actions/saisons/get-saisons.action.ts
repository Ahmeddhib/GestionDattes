"use server";

import { auth } from "@/lib/auth";
import { saisonService } from "@/services/saison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer toutes les saisons
 */
export async function getSaisonsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const saisons = await saisonService.getAll(tenantId);

        return { success: true, data: saisons };
    } catch (error) {
        console.error("Erreur lors de la récupération des saisons:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
