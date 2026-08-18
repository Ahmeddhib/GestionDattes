"use server";

import { auth } from "@/lib/auth";
import { bonAchatService } from "@/services/bon-achat.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { resolveSaisonFilter } from "@/lib/saison-filter";
import { toActionError } from "@/lib/action-error";
import { parseBorneDate, type QueryParams } from "@/lib/pagination";
import type { FiltresBonAchat } from "@/repositories/bon-achat.repository";

/**
 * Une page de bons d'achat avec leur solde, pour la page Paiements agriculteurs.
 *
 * Délègue à `bonAchatService` : les lignes de cette page SONT des bons d'achat,
 * vus sous l'angle du règlement. Dupliquer la lecture ferait diverger les deux
 * pages — en particulier le calcul du montant payé.
 */
export async function getPaiementsAgriculteursPageAction(
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
        console.error("❌ getPaiementsAgriculteursPageAction error:", error);
        return toActionError(error);
    }
}

/** Statut de paiement validé — l'URL n'impose rien à Prisma. */
function parseStatut(brut?: string): FiltresBonAchat["statut"] {
    return brut === "EN_ATTENTE" || brut === "PARTIEL" || brut === "PAYE" ? brut : undefined;
}

/**
 * Toutes les lignes du filtre courant, pour l'export.
 *
 * Les filtres arrivent en chaînes depuis l'URL et sont re-parsés ici ; le
 * `saisonId` est revalidé contre le tenant. Exporter ce que la page détient
 * produirait un fichier de dix lignes présenté comme l'export complet.
 */
export async function getPaiementsAgriculteursExportAction(params: {
    search: string;
    saisonId?: string;
    agriculteurId?: string;
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

        const data = await bonAchatService.getAllFiltre(tenantId, {
            search: params.search,
            saisonId: filtre.saisonId,
            filtres: {
                agriculteurId: params.agriculteurId || undefined,
                statut: parseStatut(params.statut),
                from: parseBorneDate(params.from, "debut"),
                to: parseBorneDate(params.to, "fin"),
            },
        });

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getPaiementsAgriculteursExportAction error:", error);
        return toActionError(error);
    }
}
