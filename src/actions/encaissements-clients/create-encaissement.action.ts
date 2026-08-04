"use server";

import { auth } from "@/lib/auth";
import { encaissementClientService } from "@/services/encaissement-client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createEncaissementClientSchema } from "@/validators/encaissement-client.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour enregistrer un encaissement sur une vente
 */
export async function createEncaissementAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const rawData = {
            venteId: formData.get("venteId"),
            montant: formData.get("montant"),
            modePaiement: formData.get("modePaiement") || undefined,
            observations: formData.get("observations") || undefined,
        };

        const parsed = createEncaissementClientSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const result = await encaissementClientService.enregistrerEncaissement(
            tenantId,
            session.user.id,
            parsed.data
        );

        revalidatePath("/dashboard/finance/ventes");

        return { success: true, data: result };
    } catch (error) {
        console.error("❌ createEncaissementAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de l'enregistrement de l'encaissement",
        };
    }
}
