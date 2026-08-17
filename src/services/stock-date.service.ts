import { stockDateRepository } from "@/repositories/stock-date.repository";
import { requirePermission } from "@/lib/permissions";
import type { SortDirection } from "@/lib/pagination";

export const stockDateService = {
    /**
     * Stock de dattes regroupé par type : quantité entrée et quantité encore
     * disponible, plus le nombre de lots qui composent chaque type.
     *
     * Le détail des lots n'est PAS inclus — il se lit à la demande via
     * `getLotsPage`.
     */
    async getGroupes(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("stock-date:read");
        return stockDateRepository.findGroupesParType(tenantId, opts);
    },

    /**
     * Une page de lots pour un type de datte.
     *
     * Le `saisonId` reçu du client n'a pas besoin d'être revalidé : la requête
     * filtre de toute façon sur `tenantId`, donc un identifiant appartenant à
     * une autre Wakala ne remonterait aucune ligne au lieu d'en fuiter.
     */
    async getLotsPage(
        tenantId: string,
        params: {
            typeDateId: string;
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
        }
    ) {
        await requirePermission("stock-date:read");
        const page = await stockDateRepository.findLotsPage(tenantId, params);

        // Aplati ici plutôt que dans le composant : la boîte de dialogue affiche
        // un agriculteur, pas une livraison imbriquée.
        return {
            ...page,
            items: page.items.map((sd) => ({
                id: sd.id,
                numeroLot: sd.Livraison.numeroLot,
                agriculteur: `${sd.Livraison.Agriculteur.nom} ${sd.Livraison.Agriculteur.prenom}`,
                dateEntree: sd.dateEntree,
                quantite: sd.quantite,
                quantiteDisponible: sd.quantiteDisponible,
            })),
        };
    },
};
