"use server";

import { auth } from "@/lib/auth";
import { typeDateService } from "@/services/type-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer un type de datte
 */
export async function deleteTypeDateAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await typeDateService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/types-dates");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteTypeDateAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression du type de datte",
        };
    }
}
