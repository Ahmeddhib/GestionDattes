"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateLivraisonSchema } from "@/validators/livraison.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour mettre à jour une livraison
 */
export async function updateLivraisonAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Récupérer les caisses depuis le formData
        const caissesJson = formData.get("caisses");
        let caisses = undefined;

        if (caissesJson) {
            try {
                caisses = JSON.parse(caissesJson as string);
            } catch (e) {
                return { success: false, error: "Format de caisses invalide" };
            }
        }

        const rawData = {
            id: formData.get("id") as string,
            agriculteurId: formData.get("agriculteurId") || undefined,
            dateLivraison: formData.get("dateLivraison") || undefined,
            quantiteLivree: formData.get("quantiteLivree") || undefined,
            quantiteAcceptee: formData.get("quantiteAcceptee") || undefined,
            caisses,
        };

        const parsed = updateLivraisonSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const livraison = await livraisonService.update(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard");

        return { success: true, data: livraison };
    } catch (error) {
        console.error("❌ updateLivraisonAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la mise à jour de la livraison",
        };
    }
}
