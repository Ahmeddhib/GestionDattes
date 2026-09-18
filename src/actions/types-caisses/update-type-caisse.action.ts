"use server";

import { auth } from "@/lib/auth";
import { typeCaisseService } from "@/services/type-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateTypeCaisseSchema } from "@/validators/type-caisse.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour mettre à jour un type de caisse
 */
export async function updateTypeCaisseAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            id: formData.get("id") as string,
            nom: formData.get("nom") || undefined,
            poidsKg: formData.get("poidsKg") ? Number(formData.get("poidsKg")) : undefined,
        };

        const parsed = updateTypeCaisseSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const typeCaisse = await typeCaisseService.update(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/types-caisses");
        revalidatePath("/dashboard");

        return { success: true, data: typeCaisse };
    } catch (error) {
        console.error("❌ updateTypeCaisseAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la mise à jour du type de caisse",
        };
    }
}
