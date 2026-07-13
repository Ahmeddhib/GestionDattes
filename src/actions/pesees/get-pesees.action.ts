"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer toutes les pesées
 */
export async function getPeseesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const pesees = await peseeService.getAll(tenantId, session.user.id);

        return { success: true, data: pesees };
    } catch (error) {
        console.error("Erreur lors de la récupération des pesées:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
