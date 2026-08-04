"use server";

import { auth } from "@/lib/auth";
import { encaissementClientService } from "@/services/encaissement-client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer l'historique des encaissements d'une vente
 */
export async function getEncaissementsByVenteAction(venteId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const encaissements = await encaissementClientService.getByVente(tenantId, venteId);

        return { success: true, data: encaissements };
    } catch (error) {
        console.error("❌ getEncaissementsByVenteAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
