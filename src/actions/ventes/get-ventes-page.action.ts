"use server";

import { auth } from "@/lib/auth";
import { venteService } from "@/services/vente.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveSaisonFilter } from "@/lib/saison-filter";
import { toActionError } from "@/lib/action-error";
import { parseBorneDate, type QueryParams } from "@/lib/pagination";
import type { FiltresVente } from "@/repositories/vente.repository";

/** Une page de ventes + les totaux du jeu filtré + les clients du filtre. */
export async function getVentesPageAction(
    params: QueryParams & { saisonId?: string; filtres?: FiltresVente }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await venteService.getPage(tenantId, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getVentesPageAction error:", error);
        return toActionError(error);
    }
}

/**
 * Toutes les lignes du filtre courant, pour l'export.
 *
 * Les filtres arrivent sous forme de chaînes d'URL : ils sont re-parsés ici, et
 * le `saisonId` revalidé contre le tenant. Exporter ce que la page détient
 * produirait un fichier de dix lignes présenté comme l'export complet.
 */
export async function getVentesExportAction(params: {
    search: string;
    saisonId?: string;
    clientId?: string;
    statut?: string;
    from?: string;
    to?: string;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const filtre = await resolveSaisonFilter(tenantId, params.saisonId);

        const statut =
            params.statut === "EN_ATTENTE" || params.statut === "PARTIEL" || params.statut === "PAYE"
                ? params.statut
                : undefined;

        const data = await venteService.getAllFiltre(tenantId, {
            search: params.search,
            saisonId: filtre.saisonId,
            filtres: {
                clientId: params.clientId || undefined,
                statut,
                from: parseBorneDate(params.from, "debut"),
                to: parseBorneDate(params.to, "fin"),
            },
        });

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getVentesExportAction error:", error);
        return toActionError(error);
    }
}
