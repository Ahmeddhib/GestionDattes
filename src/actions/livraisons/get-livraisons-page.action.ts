"use server";

import { auth } from "@/lib/auth";
import { livraisonService } from "@/services/livraison.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { toActionError } from "@/lib/action-error";
import type { QueryParams } from "@/lib/pagination";

/**
 * Une page de livraisons + les totaux du jeu filtré.
 *
 * Les paramètres arrivent déjà validés et bornés par `parseQueryParams` : cette
 * action ne fait que transporter, elle ne réinterprète rien de l'URL.
 */
export async function getLivraisonsPageAction(
    params: QueryParams & { saisonId?: string }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false as const, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const data = await livraisonService.getPage(tenantId, session.user.id, params);

        return { success: true as const, data };
    } catch (error) {
        console.error("❌ getLivraisonsPageAction error:", error);
        return toActionError(error);
    }
}
