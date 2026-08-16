"use server";

import { auth } from "@/lib/auth";
import { encaissementClientService } from "@/services/encaissement-client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { toActionError } from "@/lib/action-error";

/**
 * Liste les encaissements clients, éventuellement restreints à une saison.
 *
 * Rappel de sémantique : un encaissement appartient à la saison où l'argent a
 * physiquement circulé, pas à celle de la vente qu'il solde. Filtrer par saison
 * répond donc à « qu'ai-je encaissé pendant cette campagne ? », pas à « quelles
 * ventes de cette campagne ont été réglées ? ».
 */
export async function getEncaissementsAction(opts?: { saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const encaissements = await encaissementClientService.getAll(tenantId, opts);

        return { success: true as const, data: encaissements };
    } catch (error) {
        console.error("❌ getEncaissementsAction error:", error);
        return toActionError(error);
    }
}
