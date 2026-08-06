"use server";

import { auth } from "@/lib/auth";
import { saisonClotureService } from "@/services/saison-cloture.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour clôturer définitivement une saison : calcule et fige le
 * BilanSaison, passe la saison en CLOTUREE et ouvre automatiquement la
 * saison suivante, dans une seule transaction.
 */
export async function cloturerSaisonAction(saisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const result = await saisonClotureService.cloturerSaison(tenantId, saisonId, session.user.id);

        revalidatePath("/dashboard/finance/saisons");
        revalidatePath(`/dashboard/finance/saisons/${saisonId}`);

        return { success: true, data: result };
    } catch (error) {
        console.error("Erreur lors de la clôture de la saison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
