"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createLivraisonSchema } from "@/validators/livraison.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle livraison
 */
export async function createLivraisonAction(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Récupérer les caisses depuis le formData
        const caissesJson = formData.get("caisses");
        let caisses = [];

        if (caissesJson) {
            try {
                caisses = JSON.parse(caissesJson as string);
            } catch (e) {
                return { success: false, error: "Format de caisses invalide" };
            }
        }

        const rawData = {
            agriculteurId: formData.get("agriculteurId"),
            typeDateId: formData.get("typeDateId"),
            dateLivraison: formData.get("dateLivraison"),
            caisses,
        };

        const parsed = createLivraisonSchema.safeParse(rawData);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const livraison = await livraisonService.create(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard");

        return { success: true, data: livraison };
    } catch (error) {
        console.error("❌ createLivraisonAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création de la livraison",
        };
    }
}
