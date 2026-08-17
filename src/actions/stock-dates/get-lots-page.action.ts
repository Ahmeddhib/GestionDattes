"use server";

import { auth } from "@/lib/auth";
import { stockDateService } from "@/services/stock-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { toActionError } from "@/lib/action-error";
import type { SortDirection } from "@/lib/pagination";

/** Une page de lots pour un type de datte, lue à l'ouverture du détail. */
export async function getLotsStockPageAction(params: {
    typeDateId: string;
    page: number;
    pageSize: number;
    search: string;
    sortBy: string;
    sortDir: SortDirection;
    saisonId?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await stockDateService.getLotsPage(tenantId, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getLotsStockPageAction error:", error);
        return toActionError(error);
    }
}
