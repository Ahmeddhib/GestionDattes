"use server";

import { auth } from "@/lib/auth";
import { agriculteurService } from "@/services/agriculteur.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Server Action: Récupérer tous les agriculteurs (MULTI-TENANT)
 * Filtre automatiquement par tenantId depuis la session
 */
export async function getAgricultureursAction() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // CRITIQUE: Récupérer le tenantId depuis la session
        const tenantId = await getTenantId();

        const agriculteurs = await agriculteurService.getAll(tenantId, session.user.id);

        return { success: true, data: agriculteurs };
    } catch (error: any) {
        console.error("❌ getAgricultureursAction error:", error);
        return { success: false, error: error.message || "Erreur lors de la récupération des agriculteurs" };
    }
}
