"use server";

import { auth } from "@/lib/auth";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { getTenantId } from "@/lib/tenant/get-tenant";

/**
 * Action pour récupérer une liste simple des agriculteurs (pour les selects)
 */
export async function getAgricultureursSimpleAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        const tenantId = await getTenantId();
        const agriculteurs = await agriculteurRepository.findAll(tenantId);

        // Retourner uniquement les champs nécessaires pour un select
        const simpleList = agriculteurs.map((a) => ({
            id: a.id,
            code: a.code,
            nom: a.nom,
            prenom: a.prenom,
            label: `${a.nom} ${a.prenom} (${a.code})`,
        }));

        return { success: true, data: simpleList };
    } catch (error) {
        console.error("❌ getAgricultureursSimpleAction error:", error);
        return {
            success: false,
            error: "Erreur lors de la récupération des agriculteurs",
        };
    }
}
