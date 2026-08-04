"use server";

import { auth } from "@/lib/auth";
import { paiementAgriculteurService } from "@/services/paiement-agriculteur.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer l'historique des paiements d'un bon d'achat
 */
export async function getPaiementsByBonAchatAction(bonAchatId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const paiements = await paiementAgriculteurService.getByBonAchat(tenantId, bonAchatId);

        return { success: true, data: paiements };
    } catch (error) {
        console.error("❌ getPaiementsByBonAchatAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
