import { stockDateRepository } from "@/repositories/stock-date.repository";
import { requirePermission } from "@/lib/permissions";

export const stockDateService = {
    /**
     * Regroupe le stock de dattes par type : quantité totale entrée et
     * disponible, avec le détail des lots (une entrée de StockDate par
     * livraison) pour chaque type.
     */
    async getAll(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("stock-date:read");
        const stockDates = await stockDateRepository.findAll(tenantId, opts);

        const groups = new Map<
            string,
            {
                typeDateId: string;
                typeDate: string;
                quantiteTotale: number;
                quantiteDisponible: number;
                lots: {
                    id: string;
                    numeroLot: string;
                    agriculteur: string;
                    dateEntree: Date;
                    quantite: number;
                    quantiteDisponible: number;
                }[];
            }
        >();

        for (const sd of stockDates) {
            const key = sd.typeDateId;
            const existing = groups.get(key);
            const lot = {
                id: sd.id,
                numeroLot: sd.Livraison.numeroLot,
                agriculteur: `${sd.Livraison.Agriculteur.nom} ${sd.Livraison.Agriculteur.prenom}`,
                dateEntree: sd.dateEntree,
                quantite: sd.quantite,
                quantiteDisponible: sd.quantiteDisponible,
            };

            if (existing) {
                existing.quantiteTotale += sd.quantite;
                existing.quantiteDisponible += sd.quantiteDisponible;
                existing.lots.push(lot);
            } else {
                groups.set(key, {
                    typeDateId: sd.typeDateId,
                    typeDate: sd.TypeDate.nom,
                    quantiteTotale: sd.quantite,
                    quantiteDisponible: sd.quantiteDisponible,
                    lots: [lot],
                });
            }
        }

        return Array.from(groups.values()).sort((a, b) => a.typeDate.localeCompare(b.typeDate));
    },
};
