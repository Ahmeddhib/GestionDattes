"use server";

import { auth } from "@/lib/auth";
import { typeDateService } from "@/services/type-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateTypeDateSchema } from "@/validators/type-date.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour mettre à jour un type de datte
 */
export async function updateTypeDateAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            id: formData.get("id") as string,
            nom: formData.get("nom") || undefined,
            description: formData.get("description") !== "" ? formData.get("description") : null,
        };

        const parsed = updateTypeDateSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const typeDate = await typeDateService.update(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/types-dates");
        revalidatePath("/dashboard");

        return { success: true, data: typeDate };
    } catch (error) {
        console.error("❌ updateTypeDateAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du type de datte",
        };
    }
}
