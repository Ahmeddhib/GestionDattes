"use server";

import { auth } from "@/lib/auth";
import { bonAchatService } from "@/services/bon-achat.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les bons d'achat avec leur solde
 * (montant payé / reste à payer / statut), pour la page Finance.
 */
export async function getBonsAchatAvecSoldeAction(opts?: { saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const bonsAchat = await bonAchatService.getAll(tenantId, opts);

        return { success: true, data: bonsAchat };
    } catch (error) {
        console.error("❌ getBonsAchatAvecSoldeAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
