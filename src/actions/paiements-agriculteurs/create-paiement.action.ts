"use server";

import { auth } from "@/lib/auth";
import { resolveActionErrorMessage } from "@/lib/action-error";
import { paiementAgriculteurService } from "@/services/paiement-agriculteur.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createPaiementAgriculteurSchema } from "@/validators/paiement-agriculteur.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour enregistrer un paiement (avance/règlement) sur un bon d'achat
 */
export async function createPaiementAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            bonAchatId: formData.get("bonAchatId"),
            montant: formData.get("montant"),
            modePaiement: formData.get("modePaiement") || undefined,
            observations: formData.get("observations") || undefined,
        };

        const parsed = createPaiementAgriculteurSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const result = await paiementAgriculteurService.enregistrerPaiement(
            tenantId,
            session.user.id,
            parsed.data
        );

        revalidatePath("/dashboard/finance/paiements-agriculteurs");
        revalidatePath("/dashboard/bons-achat");

        return { success: true, data: result };
    } catch (error) {
        console.error("❌ createPaiementAction error:", error);
        return {
            success: false,
            error: await resolveActionErrorMessage(error),
        };
    }
}
