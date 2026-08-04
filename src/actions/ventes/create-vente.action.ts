"use server";

import { auth } from "@/lib/auth";
import { venteService } from "@/services/vente.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createVenteSchema } from "@/validators/vente.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle vente
 */
export async function createVenteAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            clientId: formData.get("clientId"),
            stockId: formData.get("stockId"),
            quantite: formData.get("quantite"),
            prixUnitaire: formData.get("prixUnitaire"),
            saisonId: formData.get("saisonId") || undefined,
        };

        const parsed = createVenteSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const vente = await venteService.create(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/finance/ventes");
        revalidatePath("/dashboard/stock-dattes");
        revalidatePath("/dashboard/clients");

        return { success: true, data: vente };
    } catch (error) {
        console.error("❌ createVenteAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création de la vente",
        };
    }
}
