"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { livreurService } from "@/services/livreur.service";
import { updateLivreurSchema, type UpdateLivreurInput } from "@/validators/livreur.validator";

export async function updateLivreurAction(id: string, data: Omit<UpdateLivreurInput, "id">) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Non authentifié" };
        const livreur = await livreurService.update(await getTenantId(), session.user.id, updateLivreurSchema.parse({ ...data, id }));
        revalidatePath("/dashboard/livreurs");
        return { success: true, data: livreur };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
