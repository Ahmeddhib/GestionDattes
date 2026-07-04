"use server";

import { auth } from "@/lib/auth";
import { typeDateService } from "@/services/type-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createTypeDateSchema } from "@/validators/type-date.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer un nouveau type de datte
 */
export async function createTypeDateAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            nom: formData.get("nom"),
            description: formData.get("description") || undefined,
        };

        const parsed = createTypeDateSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const typeDate = await typeDateService.create(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/types-dates");
        revalidatePath("/dashboard");

        return { success: true, data: typeDate };
    } catch (error) {
        console.error("❌ createTypeDateAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création du type de datte",
        };
    }
}
