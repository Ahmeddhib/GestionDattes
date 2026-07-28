"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer une livraison avec le détail de ses pesées réelles
 * (utilisé pour préremplir le formulaire de modification).
 */
export async function getLivraisonByIdAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const livraison = await livraisonService.getById(id, tenantId, session.user.id);

        return { success: true, data: livraison };
    } catch (error) {
        console.error("❌ getLivraisonByIdAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération de la livraison",
        };
    }
}
