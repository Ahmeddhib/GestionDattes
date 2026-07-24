"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { livreurService } from "@/services/livreur.service";
import { createLivreurSchema, type CreateLivreurInput } from "@/validators/livreur.validator";

export async function createLivreurAction(data: CreateLivreurInput) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Non authentifié" };
        const livreur = await livreurService.create(await getTenantId(), session.user.id, createLivreurSchema.parse(data));
        revalidatePath("/dashboard/livreurs");
        return { success: true, data: livreur };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
