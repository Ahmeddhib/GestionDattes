"use server";

import { auth } from "@/lib/auth";
import { pretCaisseService } from "@/services/pret-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createPretCaisseSchema } from "@/validators/pret-caisse.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer un nouveau prêt de caisses
 */
export async function createPretAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            agriculteurId: formData.get("agriculteurId"),
            typeCaisseId: formData.get("typeCaisseId"),
            nombrePrete: formData.get("nombrePrete"),
            observations: formData.get("observations") || undefined,
            livraisonId: formData.get("livraisonId") || undefined,
        };

        const parsed = createPretCaisseSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const pret = await pretCaisseService.create(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/stock-caisses");
        revalidatePath("/dashboard/agriculteurs");
        revalidatePath("/dashboard");

        return { success: true, data: pret };
    } catch (error) {
        console.error("❌ createPretAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création du prêt",
        };
    }
}
