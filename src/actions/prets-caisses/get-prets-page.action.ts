"use server";

import { auth } from "@/lib/auth";
import { pretCaisseService } from "@/services/pret-caisse.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveSaisonFilter } from "@/lib/saison-filter";
import { toActionError } from "@/lib/action-error";
import { parseBorneDate, type QueryParams } from "@/lib/pagination";
import type { FiltresPret, StatutPretFiltre } from "@/repositories/pret-caisse.repository";

/** Une page de prêts + les totaux du jeu filtré + les options des filtres. */
export async function getPretsPageAction(
    params: QueryParams & { saisonId?: string; filtres?: FiltresPret }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await pretCaisseService.getPage(tenantId, session.user.id, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getPretsPageAction error:", error);
        return toActionError(error);
    }
}

/** Statut validé — l'URL n'impose rien à Prisma. */
function parseStatut(brut?: string): StatutPretFiltre | undefined {
    return brut === "EN_COURS" || brut === "RETOURNE" || brut === "INCOMPLET" ? brut : undefined;
}

/**
 * Toutes les lignes du filtre courant, pour l'export.
 *
 * `statut` absent vaut `EN_COURS`, comme l'affichage : c'était le filtre par
 * défaut du tableau, et l'export doit porter sur le même jeu que ce qui est à
 * l'écran. `tous` lève la restriction.
 */
export async function getPretsExportAction(params: {
    search: string;
    saisonId?: string;
    agriculteurId?: string;
    typeCaisseId?: string;
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

        const data = await pretCaisseService.getAllFiltre(tenantId, session.user.id, {
            search: params.search,
            saisonId: filtre.saisonId,
            filtres: {
                agriculteurId: params.agriculteurId || undefined,
                typeCaisseId: params.typeCaisseId || undefined,
                statut: params.statut === "tous" ? undefined : parseStatut(params.statut) ?? "EN_COURS",
                from: parseBorneDate(params.from, "debut"),
                to: parseBorneDate(params.to, "fin"),
            },
        });

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getPretsExportAction error:", error);
        return toActionError(error);
    }
}
