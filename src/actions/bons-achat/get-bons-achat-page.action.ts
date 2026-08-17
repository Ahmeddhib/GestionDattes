"use server";

import { auth } from "@/lib/auth";
import { bonAchatService } from "@/services/bon-achat.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveSaisonFilter } from "@/lib/saison-filter";
import { toActionError } from "@/lib/action-error";
import type { QueryParams } from "@/lib/pagination";
import type { FiltresBonAchat } from "@/repositories/bon-achat.repository";

/** Une page de bons d'achat + les totaux du jeu filtré. */
export async function getBonsAchatPageAction(
    params: QueryParams & { saisonId?: string; filtres?: FiltresBonAchat }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await bonAchatService.getPage(tenantId, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getBonsAchatPageAction error:", error);
        return toActionError(error);
    }
}

/**
 * Toutes les lignes du filtre courant, pour l'export — exporter la page
 * afficherait dix lignes en les présentant comme l'export complet.
 */
export async function getBonsAchatExportAction(
    params: { search: string; saisonId?: string; filtres?: FiltresBonAchat }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const filtre = await resolveSaisonFilter(tenantId, params.saisonId);
        const data = await bonAchatService.getAllFiltre(tenantId, {
            search: params.search,
            saisonId: filtre.saisonId,
            filtres: params.filtres,
        });

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getBonsAchatExportAction error:", error);
        return toActionError(error);
    }
}
