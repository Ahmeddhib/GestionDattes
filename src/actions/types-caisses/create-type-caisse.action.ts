"use server";

import { auth } from "@/lib/auth";
import { typeCaisseService } from "@/services/type-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createTypeCaisseSchema } from "@/validators/type-caisse.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer un nouveau type de caisse
 */
export async function createTypeCaisseAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            nom: formData.get("nom"),
            poidsKg: Number(formData.get("poidsKg")),
        };

        const parsed = createTypeCaisseSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const typeCaisse = await typeCaisseService.create(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/types-caisses");
        revalidatePath("/dashboard");

        return { success: true, data: typeCaisse };
    } catch (error) {
        console.error("❌ createTypeCaisseAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création du type de caisse",
        };
    }
}
