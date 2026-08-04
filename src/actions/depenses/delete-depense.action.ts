"use server";

import { auth } from "@/lib/auth";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

export async function deleteDepenseAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await depenseAutreService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/finance/depenses");

        return { success: true };
    } catch (error) {
        console.error("❌ deleteDepenseAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la suppression de la dépense",
        };
    }
}
