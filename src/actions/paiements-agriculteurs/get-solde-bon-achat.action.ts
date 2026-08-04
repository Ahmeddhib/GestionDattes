"use server";

import { auth } from "@/lib/auth";
import { paiementAgriculteurService } from "@/services/paiement-agriculteur.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer le solde courant (payé/restant/statut) d'un bon d'achat
 */
export async function getSoldeBonAchatAction(bonAchatId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const solde = await paiementAgriculteurService.getSoldeBonAchat(tenantId, bonAchatId);

        return { success: true, data: solde };
    } catch (error) {
        console.error("❌ getSoldeBonAchatAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
