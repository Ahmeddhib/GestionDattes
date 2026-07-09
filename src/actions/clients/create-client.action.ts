"use server";

import { auth } from "@/lib/auth";
import { clientService } from "@/services/client.service";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { createClientSchema, type CreateClientInput } from "@/validators/client.validator";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer un nouveau client
 */
export async function createClientAction(data: CreateClientInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        // Validation avec Zod
        const validatedData = createClientSchema.parse(data);

        const tenantId = await getTenantId();
        const client = await clientService.create(tenantId, session.user.id, validatedData);

        revalidatePath("/dashboard/clients");

        return { success: true, data: client };
    } catch (error) {
        console.error("Erreur lors de la création du client:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
