"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer toutes les livraisons (du tenant actuel)
 */
export async function getLivraisonsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const livraisons = await livraisonService.getAll(tenantId, session.user.id);

        return { success: true, data: livraisons };
    } catch (error) {
        console.error("❌ getLivraisonsAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des livraisons",
        };
    }
}
