"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { saisonClotureService } from "@/services/saison-cloture.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { ROUTES } from "@/lib/routes";
import { revalidatePath } from "next/cache";

/**
 * Fige un bilan PROVISOIRE de la saison. Contrairement à la clôture, cette
 * action ne verrouille rien : la saison reste OUVERTE et l'utilisateur peut
 * continuer à recevoir des livraisons, vendre, payer, puis regénérer un
 * nouveau bilan plus tard.
 */
export async function genererBilanProvisoireAction(saisonId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const bilan = await saisonClotureService.genererBilanProvisoire(
            tenantId,
            saisonId,
            session.user.id
        );

        revalidatePath(ROUTES.SAISON(saisonId));

        return { success: true, data: { id: bilan.id, version: bilan.version } };
    } catch (error) {
        console.error("Erreur lors de la génération du bilan provisoire:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
