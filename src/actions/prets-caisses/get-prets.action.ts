"use server";

import { auth } from "@/lib/auth";
import { pretCaisseService } from "@/services/pret-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les prêts de caisses
 */
export async function getPretsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const prets = await pretCaisseService.getAll(tenantId, session.user.id);

        return { success: true, data: prets };
    } catch (error) {
        console.error("❌ getPretsAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des prêts",
        };
    }
}

/**
 * Action pour récupérer les statistiques des prêts
 */
export async function getPretsStatistiquesAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const stats = await pretCaisseService.getStatistiques(tenantId, session.user.id);

        return { success: true, data: stats };
    } catch (error) {
        console.error("❌ getPretsStatistiquesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des statistiques",
        };
    }
}
