"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import type { CreatePeseeInput } from "@/validators/pesee.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle session de pesée par type de caisse
 */
export async function createPeseeAction(data: CreatePeseeInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const pesee = await peseeService.create(tenantId, session.user.id, data);

        revalidatePath("/dashboard/pesees");
        revalidatePath("/dashboard/livraisons");

        return { success: true, data: pesee };
    } catch (error) {
        console.error("Erreur lors de la création de la pesée:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
