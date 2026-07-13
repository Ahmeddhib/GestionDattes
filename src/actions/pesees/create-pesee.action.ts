"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createPeseeSchema, type CreatePeseeInput } from "@/validators/pesee.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle pesée
 */
export async function createPeseeAction(data: CreatePeseeInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Validation avec Zod
        const validatedData = createPeseeSchema.parse(data);

        const tenantId = await getTenantId();
        const pesee = await peseeService.create(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/pesees");

        return { success: true, data: pesee };
    } catch (error) {
        console.error("Erreur lors de la création de la pesée:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
