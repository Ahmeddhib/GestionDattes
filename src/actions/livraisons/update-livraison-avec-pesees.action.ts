"use server";

import { auth } from "@/lib/auth";
import { livraisonPeseeService } from "@/services/livraison-pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { mettreAJourLivraisonAvecPeseesSchema } from "@/validators/livraison-pesee.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour modifier une livraison déjà pesée : les lignes (poids réels) sont
 * revalidées puis répercutées automatiquement sur les Pesee, le stock et le
 * bon d'achat associés.
 */
export async function updateLivraisonAvecPeseesAction(livraisonId: string, input: unknown) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const parsed = mettreAJourLivraisonAvecPeseesSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error: "Données invalides",
                errors: parsed.error.flatten().fieldErrors,
            };
        }

        const tenantId = await getTenantId();
        const result = await livraisonPeseeService.mettreAJour(
            tenantId,
            session.user.id,
            livraisonId,
            parsed.data
        );

        revalidatePath("/dashboard/livraisons");
        revalidatePath("/dashboard/pesees");
        revalidatePath("/dashboard/stock-caisses");
        revalidatePath("/dashboard/bons-achat");
        revalidatePath("/dashboard");

        return { success: true, data: result };
    } catch (error) {
        console.error("❌ updateLivraisonAvecPeseesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la modification de la livraison",
        };
    }
}
