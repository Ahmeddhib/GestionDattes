"use server";

import { auth } from "@/lib/auth";
import { saisonClotureService, SaisonNonOuverteError } from "@/services/saison-cloture.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer l'aperçu de clôture d'une saison (indicateurs +
 * checklist bloquante), sans écriture en base.
 */
export async function getClotureApercuAction(saisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const apercu = await saisonClotureService.getAperçuCloture(tenantId, saisonId);

        return { success: true, data: apercu };
    } catch (error) {
        // Ce cas est un état attendu (navigation vers un lien de clôture périmé),
        // pas un crash : on évite de le logger comme une erreur technique.
        if (!(error instanceof SaisonNonOuverteError)) {
            console.error("Erreur lors du calcul de l'aperçu de clôture:", error);
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
