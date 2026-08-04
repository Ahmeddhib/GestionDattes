"use server";

import { auth } from "@/lib/auth";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createDepenseSchema } from "@/validators/depense-autre.validator";
import type { z } from "zod";
import { revalidatePath } from "next/cache";

export async function createDepenseAction(data: z.input<typeof createDepenseSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const validatedData = createDepenseSchema.parse(data);

        const tenantId = await getTenantId();
        const depense = await depenseAutreService.create(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/finance/depenses");

        return { success: true, data: depense };
    } catch (error) {
        console.error("❌ createDepenseAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création de la dépense",
        };
    }
}
