"use server";

import { auth } from "@/lib/auth";
import { saisonService } from "@/services/saison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateSaisonSchema } from "@/validators/saison.validator";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Action pour mettre à jour une saison
 */
export async function updateSaisonAction(
    id: string,
    data: Omit<z.input<typeof updateSaisonSchema>, "id">
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const validatedData = updateSaisonSchema.parse({ ...data, id });

        const tenantId = await getTenantId();
        const saison = await saisonService.update(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/finance/saisons");

        return { success: true, data: saison };
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la saison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
