"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { revalidatePath } from "next/cache";

/**
 * Action pour supprimer un client
 */
export async function deleteClientAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        await clientService.delete(tenantId, session.user.id, id);

        revalidatePath("/dashboard/clients");

        return { success: true };
    } catch (error) {
        console.error("Erreur lors de la suppression du client:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
