"use server";

import { auth } from "@/lib/auth";
import { pretCaisseService } from "@/services/pret-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { retourCaissesSchema } from "@/validators/pret-caisse.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour enregistrer le retour de caisses
 */
export async function retournerCaissesAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            pretId: formData.get("pretId"),
            nombreRetourne: formData.get("nombreRetourne"),
            observations: formData.get("observations") || undefined,
        };

        const parsed = retourCaissesSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const pret = await pretCaisseService.retournerCaisses(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/stock-caisses");
        revalidatePath("/dashboard/agriculteurs");
        revalidatePath("/dashboard");

        return { success: true, data: pret };
    } catch (error) {
        console.error("❌ retournerCaissesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors du retour des caisses",
        };
    }
}
