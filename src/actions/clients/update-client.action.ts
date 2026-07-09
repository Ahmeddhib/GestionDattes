"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { updateClientSchema, type UpdateClientInput } from "@/validators/client.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour mettre à jour un client
 */
export async function updateClientAction(id: string, data: Omit<UpdateClientInput, "id">) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Validation avec Zod
        const validatedData = updateClientSchema.parse({ ...data, id });

        const tenantId = await getTenantId();
        const client = await clientService.update(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/clients");

        return { success: true, data: client };
    } catch (error) {
        console.error("Erreur lors de la mise à jour du client:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
