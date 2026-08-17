"use server";

import { auth } from "@/lib/auth";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { toActionError } from "@/lib/action-error";
import type { QueryParams } from "@/lib/pagination";

/** Une page de dépenses + les totaux du jeu filtré. */
export async function getDepensesPageAction(params: QueryParams & { saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await depenseAutreService.getPage(tenantId, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getDepensesPageAction error:", error);
        return toActionError(error);
    }
}
