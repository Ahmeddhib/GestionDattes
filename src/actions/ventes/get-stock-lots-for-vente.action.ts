"use server";

import { auth } from "@/lib/auth";
import { stockDateRepository } from "@/repositories/stock-date.repository";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { requirePermission } from "@/lib/permissions";

/**
 * Action pour récupérer les lots de stock (niveau livraison) disponibles à
 * la vente, pour le sélecteur du formulaire de création de vente.
 */
export async function getStockLotsForVenteAction() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, error: "Non authentifié" };
        }

        await requirePermission("vente:create");

        const tenantId = await getTenantId();
        const lots = await stockDateRepository.findAvailableLots(tenantId);

        return {
            success: true,
            data: lots.map((lot) => ({
                id: lot.id,
                typeDate: lot.TypeDate.nom,
                numeroLot: lot.Livraison.numeroLot,
                quantiteDisponible: lot.quantiteDisponible,
                // Saison d'ENTRÉE du lot, jamais réécrite : elle permet de
                // distinguer un lot de la campagne en cours d'un report.
                saisonOrigineId: lot.saisonOrigineId,
                saisonNom: lot.Saison.nom,
            })),
        };
    } catch (error) {
        console.error("❌ getStockLotsForVenteAction error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Erreur inconnue",
        };
    }
}
