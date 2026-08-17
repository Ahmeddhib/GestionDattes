"use server";

import { auth } from "@/lib/auth";
import { depenseAutreService } from "@/services/depense-autre.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveSaisonFilter } from "@/lib/saison-filter";
import { toActionError } from "@/lib/action-error";

/**
 * Toutes les lignes du filtre courant, pour l'export — sans pagination.
 *
 * Nécessaire depuis que la page ne charge plus qu'une tranche : exporter
 * `resultat.items` produirait un PDF de dix lignes en le présentant comme
 * l'export complet. Le `saisonId` est celui brut de l'URL, revalidé ici contre
 * le tenant comme sur les pages de liste.
 */
export async function getDepensesExportAction(params: { search: string; saisonId?: string }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const filtre = await resolveSaisonFilter(tenantId, params.saisonId);
        const depenses = await depenseAutreService.getAllFiltre(tenantId, {
            search: params.search,
            saisonId: filtre.saisonId,
        });

        return { success: true as const, data: depenses };
    } catch (error) {
        console.error("❌ getDepensesExportAction error:", error);
        return toActionError(error);
    }
}
