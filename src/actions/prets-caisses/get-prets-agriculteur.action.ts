"use server";

import { auth } from "@/lib/auth";
import { pretCaisseService } from "@/services/pret-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer les prêts d'un agriculteur
 */
export async function getPretsAgriculteurAction(agriculteurId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const prets = await pretCaisseService.getByAgriculteur(agriculteurId, tenantId, session.user.id);

        return { success: true, data: prets };
    } catch (error) {
        console.error("❌ getPretsAgriculteurAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des prêts",
        };
    }
}

/**
 * Action pour récupérer les prêts en cours d'un agriculteur
 */
export async function getPretsEnCoursAgriculteurAction(agriculteurId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const prets = await pretCaisseService.getPretsEnCours(agriculteurId, tenantId, session.user.id);

        return { success: true, data: prets };
    } catch (error) {
        console.error("❌ getPretsEnCoursAgriculteurAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des prêts en cours",
        };
    }
}

/**
 * Action pour récupérer le nombre de caisses restantes d'un agriculteur
 */
export async function getNombreCaissesRestantesAction(agriculteurId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const restantes = await pretCaisseService.getNombreCaissesRestantes(agriculteurId, tenantId, session.user.id);

        return { success: true, data: restantes };
    } catch (error) {
        console.error("❌ getNombreCaissesRestantesAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur lors de la récupération des caisses restantes",
        };
    }
}
