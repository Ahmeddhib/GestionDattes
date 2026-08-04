"use server";

import { auth } from "@/lib/auth";
import { financeService, type BilanFilters, type PeriodeBilan } from "@/services/finance.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

export type BilanSearchParams = {
    periode?: string;
    saisonId?: string;
    dateFrom?: string;
    dateTo?: string;
};

const VALID_PERIODES: PeriodeBilan[] = ["jour", "mois", "annee", "saison", "personnalisee"];

/**
 * Action pour récupérer le bilan financier global, à partir de paramètres
 * d'URL bruts (searchParams côté page serveur).
 */
export async function getBilanGlobalAction(params: BilanSearchParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const periode: PeriodeBilan = VALID_PERIODES.includes(params.periode as PeriodeBilan)
            ? (params.periode as PeriodeBilan)
            : "mois";

        const filters: BilanFilters = {
            periode,
            saisonId: params.saisonId,
            dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
            dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        };

        const tenantId = await getTenantId();
        const bilan = await financeService.getBilanGlobal(tenantId, filters);

        return { success: true, data: bilan };
    } catch (error) {
        console.error("❌ getBilanGlobalAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors du calcul du bilan financier",
        };
    }
}
