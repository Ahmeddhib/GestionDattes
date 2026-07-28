"use server";

import { auth } from "@/lib/auth";
import { stockDateService } from "@/services/stock-date.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer le stock de dattes regroupé par type (avec le détail
 * des lots par livraison).
 */
export async function getStockDatesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const stockDates = await stockDateService.getAll(tenantId);

        return { success: true, data: stockDates };
    } catch (error) {
        console.error("❌ getStockDatesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération du stock de dattes",
        };
    }
}
