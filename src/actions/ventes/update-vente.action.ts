"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { venteService } from "@/services/vente.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateVenteSchema } from "@/validators/vente.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour corriger une vente (client/quantité/prix)
 */
export async function updateVenteAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            id: formData.get("id"),
            clientId: formData.get("clientId"),
            quantite: formData.get("quantite"),
            prixUnitaire: formData.get("prixUnitaire"),
        };

        const parsed = updateVenteSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const vente = await venteService.update(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/finance/ventes");
        revalidatePath("/dashboard/stock-dattes");
        revalidatePath("/dashboard/clients");

        return { success: true, data: vente };
    } catch (error) {
        console.error("❌ updateVenteAction error:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
