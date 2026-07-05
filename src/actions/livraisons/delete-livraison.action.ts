"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer une livraison
 */
export async function deleteLivraisonAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await livraisonService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteLivraisonAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression de la livraison",
        };
    }
}
