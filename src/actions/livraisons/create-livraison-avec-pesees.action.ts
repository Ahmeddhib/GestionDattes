"use server";

import { auth } from "@/lib/auth";
import { livraisonPeseeService } from "@/services/livraison-pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { creerLivraisonAvecPeseesSchema } from "@/validators/livraison-pesee.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une livraison à partir de l'assistant "Nouvelle pesée" :
 * pesée des caisses déclarées → calcul automatique → livraison + bon d'achat.
 */
export async function createLivraisonAvecPeseesAction(input: unknown) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const parsed = creerLivraisonAvecPeseesSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const result = await livraisonPeseeService.creer(tenantId, session.user.id, parsed.data);

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard/pesees");
        revalidatePath("/dashboard/stock-caisses");
        revalidatePath("/dashboard");

        return { success: true, data: result };
    } catch (error) {
        console.error("❌ createLivraisonAvecPeseesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la création de la livraison",
        };
    }
}
