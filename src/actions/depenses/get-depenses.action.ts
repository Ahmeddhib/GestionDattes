"use server";

import { auth } from "@/lib/auth";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

export async function getDepensesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const depenses = await depenseAutreService.getAll(tenantId);

        return { success: true, data: depenses };
    } catch (error) {
        console.error("❌ getDepensesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
