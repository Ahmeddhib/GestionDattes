"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { saisonClotureService } from "@/services/saison-cloture.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { ROUTES } from "@/lib/routes";
import { revalidatePath } from "next/cache";

/**
 * Action pour clôturer définitivement une saison : calcule et fige le
 * BilanSaison FINAL et passe la saison en CLOTUREE, dans une seule
 * transaction. Opération irréversible.
 *
 * Elle n'ouvre PAS la saison suivante : c'est à un ADMIN de la créer
 * manuellement quand il est prêt. Le résultat porte donc
 * `prochaineSaisonRequise` pour que l'UI puisse le lui rappeler.
 */
export async function cloturerSaisonAction(saisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const result = await saisonClotureService.cloturerSaison(tenantId, saisonId, session.user.id);

        revalidatePath(ROUTES.SAISONS);
        revalidatePath(ROUTES.SAISON(saisonId));

        return { success: true, data: result };
    } catch (error) {
        console.error("Erreur lors de la clôture de la saison:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
