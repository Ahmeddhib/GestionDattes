"use server";

import { auth } from "@/lib/auth";
import { saisonService } from "@/services/saison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createSaisonSchema } from "@/validators/saison.validator";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle saison
 */
export async function createSaisonAction(data: z.input<typeof createSaisonSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const validatedData = createSaisonSchema.parse(data);

        const tenantId = await getTenantId();
        const saison = await saisonService.create(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/finance/saisons");

        return { success: true, data: saison };
    } catch (error) {
        console.error("Erreur lors de la création de la saison:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
