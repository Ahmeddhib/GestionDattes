"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer tous les clients
 */
export async function getClientsAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const clients = await clientService.getAll(tenantId, session.user.id);

        return { success: true, data: clients };
    } catch (error) {
        console.error("Erreur lors de la récupération des clients:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
