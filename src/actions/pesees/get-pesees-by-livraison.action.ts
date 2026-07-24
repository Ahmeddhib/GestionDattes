"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer les sessions de pesée déjà enregistrées pour une livraison
 */
export async function getPeseesByLivraisonAction(livraisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const pesees = await peseeService.getByLivraisonId(tenantId, session.user.id, livraisonId);

        return { success: true, data: pesees };
    } catch (error) {
        console.error("Erreur lors de la récupération des pesées de la livraison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
