"use server";

import { auth } from "@/lib/auth";
import { peseeService } from "@/services/pesee.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { toActionError } from "@/lib/action-error";
import type { QueryParams } from "@/lib/pagination";

/** Une page de livraisons pesées + les totaux du jeu filtré. */
export async function getPeseesPageAction(params: QueryParams & { saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await peseeService.getPageParLivraison(tenantId, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getPeseesPageAction error:", error);
        return toActionError(error);
    }
}
