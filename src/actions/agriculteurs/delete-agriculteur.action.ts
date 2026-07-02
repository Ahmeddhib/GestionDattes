"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Server Action: Supprimer un agriculteur (MULTI-TENANT)
 */
export async function deleteAgriculteurAction(agriculteurId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session
        const tenantId = await getTenantId();

        await agriculteurService.delete(tenantId, session.user.id, agriculteurId);

        return { success: true };
    } catch (error: any) {
        console.error("❌ deleteAgriculteurAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la suppression de l'agriculteur" };
    }
}
