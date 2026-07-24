"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import type { UpdatePeseeInput } from "@/validators/pesee.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour remplacer les caisses d'une session de pesée existante
 */
export async function updatePeseeAction(id: string, data: Omit<UpdatePeseeInput, "id">) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const pesee = await peseeService.update(tenantId, session.user.id, { ...data, id });

        revalidatePath("/dashboard/pesees");
        revalidatePath("/dashboard/livraisons");

        return { success: true, data: pesee };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la pesée:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
