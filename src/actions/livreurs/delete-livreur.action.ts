"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { livreurService } from "@/services/livreur.service";

export async function deleteLivreurAction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Non authentifié" };
        await livreurService.delete(await getTenantId(), session.user.id, id);
        revalidatePath("/dashboard/livreurs");
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
