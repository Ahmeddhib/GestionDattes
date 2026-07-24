"use server";

import { auth } from "@/lib/auth";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { livreurService } from "@/services/livreur.service";

export async function getLivreursAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "Non authentifié" };
        const livreurs = await livreurService.getAll(await getTenantId());
        return { success: true, data: livreurs };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
    }
}
