"use server";

import { auth } from "@/lib/auth";
import { typeCaisseService } from "@/services/type-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer un type de caisse
 */
export async function deleteTypeCaisseAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await typeCaisseService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/types-caisses");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteTypeCaisseAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression du type de caisse",
        };
    }
}
