import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
} from "date-fns";
import { financeRepository, type PeriodFilter } from "@/repositories/finance.repository";
import { saisonRepository } from "@/repositories/saison.repository";
import { requirePermission } from "@/lib/permissions";

export type PeriodeBilan = "jour" | "semaine" | "mois" | "annee" | "saison" | "personnalisee";

export interface BilanFilters {
    periode: PeriodeBilan;
    saisonId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}

/**
 * Résout un filtre de période en filtre concret pour les agrégats du bilan :
 * soit un saisonId exact (jamais déduit de dates — le métier veut un
 * rattachement direct), soit une plage de dates pour jour/mois/année/
 * personnalisée. Fonction pure, testable indépendamment de la couche HTTP/DB.
 */
export async function resolvePeriodFilter(
    tenantId: string,
    filters: BilanFilters
): Promise<{ filter: PeriodFilter; label: string }> {
    const now = new Date();

    if (filters.periode === "personnalisee" && filters.dateFrom && filters.dateTo) {
        return {
            filter: { range: { gte: filters.dateFrom, lte: filters.dateTo } },
            label: `${filters.dateFrom.toLocaleDateString("fr-FR")} - ${filters.dateTo.toLocaleDateString("fr-FR")}`,
        };
    }

    if (filters.periode === "saison" && filters.saisonId) {
        const saison = await saisonRepository.findById(tenantId, filters.saisonId);
        if (saison) {
            return {
                filter: { saisonId: saison.id },
                label: saison.nom,
            };
        }
    }

    if (filters.periode === "jour") {
        return { filter: { range: { gte: startOfDay(now), lte: endOfDay(now) } }, label: "Aujourd'hui" };
    }

    if (filters.periode === "semaine") {
        const debut = startOfWeek(now, { weekStartsOn: 1 });
        const fin = endOfWeek(now, { weekStartsOn: 1 });
        return {
            filter: { range: { gte: debut, lte: fin } },
            label: `Semaine du ${debut.toLocaleDateString("fr-FR")} au ${fin.toLocaleDateString("fr-FR")}`,
        };
    }

    if (filters.periode === "annee") {
        return {
            filter: { range: { gte: startOfYear(now), lte: endOfYear(now) } },
            label: `Année ${now.getFullYear()}`,
        };
    }

    // Défaut : mois en cours
    return {
        filter: { range: { gte: startOfMonth(now), lte: endOfMonth(now) } },
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

        const { filter, label } = await resolvePeriodFilter(tenantId, filters);

        const [
            totalEncaissementsClients,
            totalPaiementsAgriculteurs,
            totalDepensesAutres,
            totalVentes,
            totalAchats,
            creancesClients,
            dettesAgriculteurs,
        ] = await Promise.all([
            financeRepository.getTotalEncaissementsClients(tenantId, filter),
            financeRepository.getTotalPaiementsAgriculteurs(tenantId, filter),
            financeRepository.getTotalDepensesAutres(tenantId, filter),
            financeRepository.getTotalVentes(tenantId, filter),
            financeRepository.getTotalAchats(tenantId, filter),
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
