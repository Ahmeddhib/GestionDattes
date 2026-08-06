"use server";

import { auth } from "@/lib/auth";
import { saisonService } from "@/services/saison.service";
import { saisonClotureService } from "@/services/saison-cloture.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer le détail d'une saison, avec son bilan figé s'il
 * existe (uniquement si la saison est CLOTUREE).
 */
export async function getSaisonDetailAction(saisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const saison = await saisonService.getById(tenantId, saisonId);
        const bilan =
            saison.statut === "CLOTUREE"
                ? await saisonClotureService.getBilanSaison(tenantId, saisonId)
                : null;

        return { success: true, data: { saison, bilan } };
    } catch (error) {
        console.error("Erreur lors de la récupération du détail de la saison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
