"use server";

import { auth } from "@/lib/auth";
import { stockDateService } from "@/services/stock-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer le stock de dattes regroupé par type.
 *
 * Ne renvoie plus le détail des lots : il se lit à la demande via
 * `getLotsStockPageAction`.
 */
export async function getStockDatesAction(opts?: { saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const stockDates = await stockDateService.getGroupes(tenantId, opts);

        return { success: true, data: stockDates };
    } catch (error) {
        console.error("❌ getStockDatesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération du stock de dattes",
        };
    }
}
