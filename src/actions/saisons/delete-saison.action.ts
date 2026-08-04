"use server";

import { auth } from "@/lib/auth";
import { saisonService } from "@/services/saison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer une saison
 */
export async function deleteSaisonAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await saisonService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/finance/saisons");

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la saison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
