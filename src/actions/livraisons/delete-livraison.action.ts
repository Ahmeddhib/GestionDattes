"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer une livraison
 */
export async function cancelLivraisonAction(id: string, motifAnnulation: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await livraisonService.cancel(tenantId, session.user.id, id, motifAnnulation);

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteLivraisonAction error:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}

/** Compatibilité avec les anciens appels : l'opération reste une annulation tracée. */
export async function deleteLivraisonAction(id: string) {
    return cancelLivraisonAction(id, "Annulation demandée par l'utilisateur");
}
