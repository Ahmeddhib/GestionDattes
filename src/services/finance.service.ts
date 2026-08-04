import {
    startOfDay,
    endOfDay,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
} from "date-fns";
import { financeRepository, type DateRangeFilter } from "@/repositories/finance.repository";
import { saisonRepository } from "@/repositories/saison.repository";
import { requirePermission } from "@/lib/permissions";

export type PeriodeBilan = "jour" | "mois" | "annee" | "saison" | "personnalisee";

export interface BilanFilters {
    periode: PeriodeBilan;
    saisonId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

/**
 * Résout un filtre de période en plage de dates concrète {gte, lte}.
 * Fonction pure, testable indépendamment de la couche HTTP/DB.
 */
export async function resolvePeriodRange(
    tenantId: string,
    filters: BilanFilters
): Promise<{ range: DateRangeFilter; label: string }> {
    const now = new Date();

    if (filters.periode === "personnalisee" && filters.dateFrom && filters.dateTo) {
        return {
            range: { gte: filters.dateFrom, lte: filters.dateTo },
            label: `${filters.dateFrom.toLocaleDateString("fr-FR")} - ${filters.dateTo.toLocaleDateString("fr-FR")}`,
        };
    }

    if (filters.periode === "saison" && filters.saisonId) {
        const saison = await saisonRepository.findById(tenantId, filters.saisonId);
        if (saison) {
            return {
                range: { gte: saison.dateDebut, lte: saison.dateFin },
                label: saison.nom,
            };
        }
    }

    if (filters.periode === "jour") {
        return { range: { gte: startOfDay(now), lte: endOfDay(now) }, label: "Aujourd'hui" };
    }

    if (filters.periode === "annee") {
        return {
            range: { gte: startOfYear(now), lte: endOfYear(now) },
            label: `Année ${now.getFullYear()}`,
        };
    }

    // Défaut : mois en cours
    return {
        range: { gte: startOfMonth(now), lte: endOfMonth(now) },
        label: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
}

export type BilanGlobal = Awaited<ReturnType<typeof financeService.getBilanGlobal>>;

export const financeService = {
    /**
     * Bilan financier global du tenant sur une période donnée. Tous les
     * chiffres sont recalculés à la volée (jamais persistés).
     */
    async getBilanGlobal(tenantId: string, filters: BilanFilters) {
        await requirePermission("finance:read");

        const { range, label } = await resolvePeriodRange(tenantId, filters);

        const [
            totalEncaissementsClients,
            totalPaiementsAgriculteurs,
            totalDepensesAutres,
            totalVentes,
            totalAchats,
            creancesClients,
            dettesAgriculteurs,
        ] = await Promise.all([
            financeRepository.getTotalEncaissementsClients(tenantId, range),
            financeRepository.getTotalPaiementsAgriculteurs(tenantId, range),
            financeRepository.getTotalDepensesAutres(tenantId, range),
            financeRepository.getTotalVentes(tenantId, range),
            financeRepository.getTotalAchats(tenantId, range),
            financeRepository.getCreancesClients(tenantId),
            financeRepository.getDettesAgriculteurs(tenantId),
        ]);

        const argentEncaisse = totalEncaissementsClients;
        const argentSorti = totalPaiementsAgriculteurs + totalDepensesAutres;
        const tresorerieNette = argentEncaisse - argentSorti;
        const chiffreAffaires = totalVentes;
        // Résultat net : indicateur "sur engagement" (chiffre d'affaires - achats
        // - dépenses), distinct de la trésorerie nette qui est un indicateur
        // "caisse" (encaissé - décaissé). Les deux sont demandés par le métier
        // et représentent des choses différentes.
        const resultatNet = chiffreAffaires - totalAchats - totalDepensesAutres;

        return {
            periodeLabel: label,
            totalEncaissementsClients,
            totalPaiementsAgriculteurs,
            totalDepensesAutres,
            totalVentes,
            totalAchats,
            argentEncaisse,
            argentSorti,
            tresorerieNette,
            chiffreAffaires,
            resultatNet,
            creancesClients: creancesClients.total,
            creancesClientsDetail: creancesClients.detail,
            dettesAgriculteurs: dettesAgriculteurs.total,
            dettesAgriculteursDetail: dettesAgriculteurs.detail,
        };
    },
};
