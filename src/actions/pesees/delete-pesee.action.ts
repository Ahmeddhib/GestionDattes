"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer une pesée
 */
export async function deletePeseeAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await peseeService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/pesees");
        revalidatePath("/dashboard/livraisons");

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression de la pesée:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
