import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { getServerTranslations } from "@/i18n/server";
import { financeService, resolvePeriodFilter, type BilanFilters } from "@/services/finance.service";
import { financeRepository } from "@/repositories/finance.repository";
import { computeIndicateursSaison } from "@/services/saison-bilan.service";
import { saisonRepository } from "@/repositories/saison.repository";
import { saisonService } from "@/services/saison.service";
import { dashboardRepository, type TrendFilter } from "@/repositories/dashboard.repository";
import { formatEvolution, formatKg, formatMontant } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type {
    AlertItem,
    DashboardFiltersValue,
    KpiDatum,
    RecentActivitySection,
    StockParTypeDatum,
    TopAgriculteurDatum,
    TrendPoint,
} from "@/types/dashboard";

type Granularity = "day" | "month";

function formatPeriodeLabel(date: Date, granularity: Granularity): string {
    return granularity === "day"
        ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
        : date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

/**
 * Résout le filtre de période du dashboard en un `TrendFilter` (toujours
 * borné) + une granularité day/month déduite de l'étendue de la période.
 */
async function resolveTrendFilter(
    tenantId: string,
    filters: DashboardFiltersValue
): Promise<{ trendFilter: TrendFilter; granularity: Granularity }> {
    const { filter } = await resolvePeriodFilter(tenantId, filters as BilanFilters);

    if ("saisonId" in filter) {
        const saison = await saisonRepository.findById(tenantId, filter.saisonId);
        const spanDays = saison ? differenceInCalendarDays(saison.dateFin, saison.dateDebut) : 90;
        return { trendFilter: { saisonId: filter.saisonId }, granularity: spanDays > 62 ? "month" : "day" };
    }

    const gte = filter.range?.gte ?? new Date();
    const lte = filter.range?.lte ?? new Date();
    const spanDays = differenceInCalendarDays(lte, gte);
    return { trendFilter: { dateFrom: gte, dateTo: lte }, granularity: spanDays > 62 ? "month" : "day" };
}

/**
 * Valeurs financières agrégées pour une période. En mode "saison", réutilise
 * `computeIndicateursSaison` (déjà tout calculé, même logique que le bilan de
 * clôture) plutôt que de reconstruire les sommes — et si la saison est déjà
 * CLOTUREE, lit son `BilanSaison` figé sans jamais recalculer.
 */
async function getMoneyIndicators(tenantId: string, filters: DashboardFiltersValue) {
    if (filters.periode === "saison" && filters.saisonId) {
        const saison = await saisonRepository.findById(tenantId, filters.saisonId);

        if (saison?.statut === "CLOTUREE") {
            // `type: "FINAL"` est indispensable : une saison peut porter
            // plusieurs bilans PROVISOIRE générés avant sa clôture, et sans ce
            // filtre le dashboard afficherait l'un d'eux à la place du bilan
            // de clôture — sans la moindre erreur visible.
            const bilan = await prisma.bilanSaison.findFirst({
                where: { saisonId: filters.saisonId, tenantId, type: "FINAL" },
            });
            if (bilan) {
                return {
                    totalAchats: bilan.totalAchatsMontant,
                    chiffreAffaires: bilan.chiffreAffairesVentes,
                    totalEncaissementsClients: bilan.totalEncaissements,
                    totalPaiementsAgriculteurs: bilan.totalPaiementsAgriculteurs,
                    tresorerieNette: bilan.tresorerie,
                    dettesAgriculteurs: bilan.soldeAgriculteursRestant,
                    creancesClients: bilan.creancesClientsRestantes,
                };
            }
        }

        const indicateurs = await computeIndicateursSaison(tenantId, filters.saisonId);
        return {
            totalAchats: indicateurs.totalAchatsMontant,
            chiffreAffaires: indicateurs.chiffreAffairesVentes,
            totalEncaissementsClients: indicateurs.totalEncaissements,
            totalPaiementsAgriculteurs: indicateurs.totalPaiementsAgriculteurs,
            tresorerieNette: indicateurs.tresorerie,
            dettesAgriculteurs: indicateurs.soldeAgriculteursRestant,
            creancesClients: indicateurs.creancesClientsRestantes,
        };
    }

    const bilan = await financeService.getBilanGlobal(tenantId, filters as BilanFilters);
    return {
        totalAchats: bilan.totalAchats,
        chiffreAffaires: bilan.chiffreAffaires,
        totalEncaissementsClients: bilan.totalEncaissementsClients,
        totalPaiementsAgriculteurs: bilan.totalPaiementsAgriculteurs,
        tresorerieNette: bilan.tresorerieNette,
        dettesAgriculteurs: bilan.dettesAgriculteurs,
        creancesClients: bilan.creancesClients,
    };
}

export const dashboardService = {
    /**
     * Les 10 cartes KPI. Pas de "résultat net" tant que le coût réel des
     * marchandises vendues et la valorisation du stock ne sont pas
     * disponibles (demande explicite). Chaque groupe est masqué si
     * l'utilisateur n'a pas la permission de lecture correspondante.
     */
    async getKpis(tenantId: string, filters: DashboardFiltersValue): Promise<KpiDatum[]> {
        const t = await getServerTranslations();
        const [canLivraison, canStock, canFinance] = await Promise.all([
            hasPermission("livraison:read"),
            hasPermission("stock-date:read"),
            hasPermission("finance:read"),
        ]);

        const { filter } = await resolvePeriodFilter(tenantId, filters as BilanFilters);
        const isSaisonMode = "saisonId" in filter;

        const trendFilter: TrendFilter = isSaisonMode
            ? { saisonId: (filter as { saisonId: string }).saisonId }
            : { dateFrom: filter.range!.gte!, dateTo: filter.range!.lte! };

        let previousTrendFilter: TrendFilter | null = null;
        let previousBilanFilters: DashboardFiltersValue | null = null;
        let comparisonLabel = t("dashboard.premium.comparisonPeriod");
        let comparisonKey = "comparisonPeriod";
        if (isSaisonMode) {
            const currentSaison = await saisonRepository.findById(tenantId, (filter as { saisonId: string }).saisonId);
            const previousSaison = currentSaison
                ? await saisonRepository.findPrevious(tenantId, currentSaison.dateDebut)
                : null;
            if (previousSaison) {
                previousTrendFilter = { saisonId: previousSaison.id };
                previousBilanFilters = { periode: "saison", saisonId: previousSaison.id };
                comparisonLabel = t("dashboard.premium.comparisonSeason");
                comparisonKey = "comparisonSeason";
            }
        } else if (filter.range?.gte && filter.range?.lte) {
            const durationMs = filter.range.lte.getTime() - filter.range.gte.getTime();
            const prevLte = new Date(filter.range.gte.getTime() - 1);
            const prevGte = new Date(prevLte.getTime() - durationMs);
            previousTrendFilter = { dateFrom: prevGte, dateTo: prevLte };
            previousBilanFilters = { periode: "personnalisee", dateFrom: prevGte, dateTo: prevLte };
            comparisonLabel = ({
                jour: t("dashboard.premium.comparisonDay"),
                semaine: t("dashboard.premium.comparisonWeek"),
                mois: t("dashboard.premium.comparisonMonth"),
                annee: t("dashboard.premium.comparisonYear"),
                personnalisee: t("dashboard.premium.comparisonPeriod"),
            } as Partial<Record<DashboardFiltersValue["periode"], string>>)[filters.periode] ?? comparisonLabel;
            comparisonKey = ({
                jour: "comparisonDay",
                semaine: "comparisonWeek",
                mois: "comparisonMonth",
                annee: "comparisonYear",
                personnalisee: "comparisonPeriod",
            } as Partial<Record<DashboardFiltersValue["periode"], string>>)[filters.periode] ?? comparisonKey;
        }

        const kpis: KpiDatum[] = [];

        if (canLivraison) {
            const [current, previous] = await Promise.all([
                dashboardRepository.getLivraisonsSummary(tenantId, trendFilter),
                previousTrendFilter ? dashboardRepository.getLivraisonsSummary(tenantId, previousTrendFilter) : null,
            ]);

            kpis.push({
                code: "quantiteNetteLivree",
                label: t("dashboard.kpi.quantiteNetteLivree"),
                value: current.quantiteLivree,
                unit: "kg",
                evolution: previous ? formatEvolution(current.quantiteLivree, previous.quantiteLivree) : undefined,
                href: ROUTES.LIVRAISONS,
            });
            kpis.push({
                code: "nombreLivraisons",
                label: t("dashboard.kpi.nombreLivraisons"),
                value: current.nombreLivraisons,
                unit: "nombre",
                evolution: previous ? formatEvolution(current.nombreLivraisons, previous.nombreLivraisons) : undefined,
                href: ROUTES.LIVRAISONS,
            });
        }

        if (canStock) {
            const stock = await dashboardRepository.getStockParTypeDate(tenantId);
            const total = stock.reduce((sum, s) => sum + s.quantiteDisponible, 0);
            kpis.push({
                code: "stockTotal",
                label: t("dashboard.kpi.stockTotal"),
                value: total,
                unit: "kg",
                href: ROUTES.STOCK_DATTES,
            });
        }

        if (canFinance) {
            const [current, previous] = await Promise.all([
                getMoneyIndicators(tenantId, filters),
                previousBilanFilters ? getMoneyIndicators(tenantId, previousBilanFilters) : null,
            ]);

            kpis.push({
                code: "montantBonsAchat",
                label: t("dashboard.kpi.montantBonsAchat"),
                value: current.totalAchats,
                unit: "TND",
                evolution: previous ? formatEvolution(current.totalAchats, previous.totalAchats, true) : undefined,
                href: ROUTES.BONS_ACHAT,
            });
            kpis.push({
                code: "chiffreAffaires",
                label: t("dashboard.kpi.chiffreAffaires"),
                value: current.chiffreAffaires,
                unit: "TND",
                evolution: previous ? formatEvolution(current.chiffreAffaires, previous.chiffreAffaires) : undefined,
                href: ROUTES.VENTES,
            });
            kpis.push({
                code: "totalEncaisse",
                label: t("dashboard.kpi.totalEncaisse"),
                value: current.totalEncaissementsClients,
                unit: "TND",
                evolution: previous
                    ? formatEvolution(current.totalEncaissementsClients, previous.totalEncaissementsClients)
                    : undefined,
                href: ROUTES.VENTES,
            });
            kpis.push({
                code: "totalPayeAgriculteurs",
                label: t("dashboard.kpi.totalPayeAgriculteurs"),
                value: current.totalPaiementsAgriculteurs,
                unit: "TND",
                evolution: previous
                    ? formatEvolution(current.totalPaiementsAgriculteurs, previous.totalPaiementsAgriculteurs, true)
                    : undefined,
                href: ROUTES.PAIEMENTS_AGRICULTEURS,
            });
            kpis.push({
                code: "tresorerieNette",
                label: t("dashboard.kpi.tresorerieNette"),
                value: current.tresorerieNette,
                unit: "TND",
                evolution: previous ? formatEvolution(current.tresorerieNette, previous.tresorerieNette) : undefined,
                href: ROUTES.FINANCE,
            });
            // Dettes/créances = soldes de tout temps, pas bornés par la période — pas d'évolution.
            kpis.push({
                code: "dettesAgriculteurs",
                label: t("dashboard.kpi.dettesAgriculteurs"),
                value: current.dettesAgriculteurs,
                unit: "TND",
                href: ROUTES.PAIEMENTS_AGRICULTEURS,
            });
            kpis.push({
                code: "creancesClients",
                label: t("dashboard.kpi.creancesClients"),
                value: current.creancesClients,
                unit: "TND",
                href: ROUTES.VENTES,
            });
        }

        return kpis.map((kpi) => kpi.evolution ? { ...kpi, comparisonLabel, comparisonKey } : kpi);
    },

    async getDeliveriesTrend(tenantId: string, filters: DashboardFiltersValue): Promise<TrendPoint[]> {
        if (!(await hasPermission("livraison:read"))) return [];

        const { trendFilter, granularity } = await resolveTrendFilter(tenantId, filters);
        const rows = await dashboardRepository.getLivraisonsTrend(tenantId, trendFilter, granularity);

        return rows.map((r) => ({
            periode: formatPeriodeLabel(r.periode, granularity),
            poidsNet: r.poidsNet,
            quantitePayable: r.quantitePayable,
        }));
    },

    async getCashFlowTrend(tenantId: string, filters: DashboardFiltersValue): Promise<TrendPoint[]> {
        if (!(await hasPermission("finance:read"))) return [];

        const { trendFilter, granularity } = await resolveTrendFilter(tenantId, filters);
        const { encaissements, paiements, depenses } = await dashboardRepository.getCashFlowTrend(
            tenantId,
            trendFilter,
            granularity
        );

        const map = new Map<string, { date: Date; encaissements: number; paiements: number; depenses: number }>();
        function merge(rows: Array<{ periode: Date; total: number }>, key: "encaissements" | "paiements" | "depenses") {
            for (const r of rows) {
                const iso = r.periode.toISOString();
                const point = map.get(iso) ?? { date: r.periode, encaissements: 0, paiements: 0, depenses: 0 };
                point[key] = r.total;
                map.set(iso, point);
            }
        }
        merge(encaissements, "encaissements");
        merge(paiements, "paiements");
        merge(depenses, "depenses");

        return Array.from(map.values())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((p) => ({
                periode: formatPeriodeLabel(p.date, granularity),
                encaissements: p.encaissements,
                paiements: p.paiements,
                depenses: p.depenses,
            }));
    },

    async getSalesTrend(tenantId: string, filters: DashboardFiltersValue): Promise<TrendPoint[]> {
        if (!(await hasPermission("vente:read"))) return [];

        const { trendFilter, granularity } = await resolveTrendFilter(tenantId, filters);
        const rows = await dashboardRepository.getSalesTrend(tenantId, trendFilter, granularity);

        return rows.map((r) => ({
            periode: formatPeriodeLabel(r.periode, granularity),
            quantite: r.quantite,
            montant: r.montant,
        }));
    },

    /** Instantané courant, jamais filtré par période. */
    async getStockByType(tenantId: string): Promise<StockParTypeDatum[]> {
        if (!(await hasPermission("stock-date:read"))) return [];
        return dashboardRepository.getStockParTypeDate(tenantId);
    },

    async getLivraisonsRepartition(tenantId: string, filters: DashboardFiltersValue) {
        if (!(await hasPermission("livraison:read"))) return [];
        const { trendFilter } = await resolveTrendFilter(tenantId, filters);
        return dashboardRepository.getRepartitionLivraisonsParTypeDate(tenantId, trendFilter);
    },

    async getTopAgriculteurs(
        tenantId: string,
        filters: DashboardFiltersValue,
        limit = 5
    ): Promise<TopAgriculteurDatum[]> {
        if (!(await hasPermission("livraison:read"))) return [];
        const { trendFilter } = await resolveTrendFilter(tenantId, filters);
        return dashboardRepository.getTopAgriculteurs(tenantId, trendFilter, limit);
    },

    async getRecentActivity(tenantId: string): Promise<RecentActivitySection[]> {
        const t = await getServerTranslations();
        const [canLivraison, canBonAchat, canPaiement, canVente, canEncaissement, canStock] = await Promise.all([
            hasPermission("livraison:read"),
            hasPermission("bon-achat:read"),
            hasPermission("paiement-agriculteur:read"),
            hasPermission("vente:read"),
            hasPermission("encaissement-client:read"),
            hasPermission("stock-date:read"),
        ]);

        const sections: RecentActivitySection[] = [];
        const tasks: Promise<void>[] = [];

        if (canLivraison) {
            tasks.push(
                (async () => {
                    const rows = await prisma.livraison.findMany({
                        where: { tenantId },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: {
                            id: true,
                            numeroLot: true,
                            quantiteLivree: true,
                            dateLivraison: true,
                            Agriculteur: { select: { nom: true, prenom: true } },
                        },
                    });
                    sections.push({
                        code: "livraisons",
                        unit: "kg" as const,
                        title: t("dashboard.recentActivity.livraisons"),
                        href: ROUTES.LIVRAISONS,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: `Lot ${r.numeroLot}`,
                            sousLabel: `${r.Agriculteur.nom} ${r.Agriculteur.prenom}`,
                            montant: r.quantiteLivree,
                            date: r.dateLivraison,
                            href: ROUTES.LIVRAISONS,
                        })),
                    });
                })()
            );
        }

        if (canBonAchat) {
            tasks.push(
                (async () => {
                    const rows = await prisma.bonAchat.findMany({
                        where: { tenantId },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: { id: true, numero: true, montant: true, createdAt: true },
                    });
                    sections.push({
                        code: "bonsAchat",
                        unit: "TND" as const,
                        title: t("dashboard.recentActivity.bonsAchat"),
                        href: ROUTES.BONS_ACHAT,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: r.numero,
                            montant: r.montant,
                            date: r.createdAt,
                            href: ROUTES.BONS_ACHAT,
                        })),
                    });
                })()
            );
        }

        if (canPaiement) {
            tasks.push(
                (async () => {
                    const rows = await prisma.paiementAgriculteur.findMany({
                        where: { tenantId },
                        orderBy: { datePaiement: "desc" },
                        take: 5,
                        select: {
                            id: true,
                            montant: true,
                            datePaiement: true,
                            BonAchat: { select: { numero: true } },
                        },
                    });
                    sections.push({
                        code: "paiementsAgriculteurs",
                        unit: "TND" as const,
                        title: t("dashboard.recentActivity.paiementsAgriculteurs"),
                        href: ROUTES.PAIEMENTS_AGRICULTEURS,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: `Bon ${r.BonAchat.numero}`,
                            montant: r.montant,
                            date: r.datePaiement,
                            href: ROUTES.PAIEMENTS_AGRICULTEURS,
                        })),
                    });
                })()
            );
        }

        if (canVente) {
            tasks.push(
                (async () => {
                    const rows = await prisma.vente.findMany({
                        where: { tenantId },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: { id: true, montant: true, date: true, Client: { select: { nom: true } } },
                    });
                    sections.push({
                        code: "ventes",
                        unit: "TND" as const,
                        title: t("dashboard.recentActivity.ventes"),
                        href: ROUTES.VENTES,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: r.Client.nom,
                            montant: r.montant,
                            date: r.date,
                            href: ROUTES.VENTES,
                        })),
                    });
                })()
            );
        }

        if (canEncaissement) {
            tasks.push(
                (async () => {
                    const rows = await prisma.encaissementClient.findMany({
                        where: { tenantId },
                        orderBy: { dateEncaissement: "desc" },
                        take: 5,
                        select: {
                            id: true,
                            montant: true,
                            dateEncaissement: true,
                            Vente: { select: { Client: { select: { nom: true } } } },
                        },
                    });
                    sections.push({
                        code: "encaissements",
                        unit: "TND" as const,
                        title: t("dashboard.recentActivity.encaissements"),
                        href: ROUTES.VENTES,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: r.Vente.Client.nom,
                            montant: r.montant,
                            date: r.dateEncaissement,
                            href: ROUTES.VENTES,
                        })),
                    });
                })()
            );
        }

        if (canStock) {
            tasks.push(
                (async () => {
                    const rows = await prisma.stockDate.findMany({
                        where: { tenantId },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: {
                            id: true,
                            quantite: true,
                            dateEntree: true,
                            TypeDate: { select: { nom: true } },
                            Livraison: { select: { numeroLot: true } },
                        },
                    });
                    sections.push({
                        code: "mouvementsStock",
                        unit: "kg" as const,
                        title: t("dashboard.recentActivity.mouvementsStock"),
                        href: ROUTES.STOCK_DATTES,
                        items: rows.map((r) => ({
                            id: r.id,
                            label: r.TypeDate.nom,
                            sousLabel: `Lot ${r.Livraison.numeroLot}`,
                            montant: r.quantite,
                            date: r.dateEntree,
                            href: ROUTES.STOCK_DATTES,
                        })),
                    });
                })()
            );
        }

        await Promise.all(tasks);
        return sections;
    },

    async getAlerts(tenantId: string, filters: DashboardFiltersValue): Promise<AlertItem[]> {
        const t = await getServerTranslations();
        const [canFinance, canLivraison, canStock, canPret, canSaison] = await Promise.all([
            hasPermission("finance:read"),
            hasPermission("livraison:read"),
            hasPermission("stock-date:read"),
            hasPermission("pret-caisse:read"),
            hasPermission("saison:read"),
        ]);

        const alerts: AlertItem[] = [];

        const [counts, stock, saisonOuverte] = await Promise.all([
            canFinance || canLivraison || canPret ? dashboardRepository.getAlertesCounts(tenantId) : null,
            canStock ? dashboardRepository.getStockParTypeDate(tenantId) : null,
            canSaison ? saisonService.getOuverte(tenantId) : null,
        ]);

        if (canFinance && counts) {
            if (counts.bonsAchatImpayes > 0) {
                const dettes = await financeRepository.getDettesAgriculteurs(tenantId);
                alerts.push({
                    code: "bonsAchatImpayes",
                    severity: "warning",
                    message: t("dashboard.alerts.bonsAchatImpayes", {
                        count: String(counts.bonsAchatImpayes),
                        montant: formatMontant(dettes.total),
                    }),
                    href: ROUTES.BONS_ACHAT,
                });
            }
            if (counts.ventesImpayees > 0) {
                const creances = await financeRepository.getCreancesClients(tenantId);
                alerts.push({
                    code: "creancesClients",
                    severity: "warning",
                    message: t("dashboard.alerts.creancesClients", {
                        count: String(counts.ventesImpayees),
                        montant: formatMontant(creances.total),
                    }),
                    href: ROUTES.VENTES,
                });
            }
        }

        if (canLivraison && counts) {
            if (counts.livraisonsSansBonAchat > 0) {
                alerts.push({
                    code: "livraisonsSansBonAchat",
                    severity: "info",
                    message: t("dashboard.alerts.livraisonsSansBonAchat", {
                        count: String(counts.livraisonsSansBonAchat),
                    }),
                    href: ROUTES.LIVRAISONS,
                });
            }
            if (counts.livraisonsSansPesee > 0) {
                alerts.push({
                    code: "livraisonsSansPesee",
                    severity: "info",
                    message: t("dashboard.alerts.livraisonsSansPesee", {
                        count: String(counts.livraisonsSansPesee),
                    }),
                    href: ROUTES.LIVRAISONS,
                });
            }
        }

        if (canPret && counts && counts.pretsEnCours > 0) {
            alerts.push({
                code: "caissesNonRetournees",
                severity: "warning",
                message: t("dashboard.alerts.caissesNonRetournees", { count: String(counts.pretsEnCours) }),
                href: ROUTES.STOCK_CAISSES,
            });
        }

        if (canStock && stock) {
            for (const s of stock) {
                if (s.seuilAlerte != null && s.quantiteDisponible < s.seuilAlerte) {
                    alerts.push({
                        code: `stockFaible-${s.typeDateId}`,
                        severity: "danger",
                        message: t("dashboard.alerts.stockFaible", {
                            nom: s.nom,
                            quantite: formatKg(s.quantiteDisponible),
                            seuil: formatKg(s.seuilAlerte),
                        }),
                        href: ROUTES.STOCK_DATTES,
                    });
                }
            }
        }

        if (canSaison) {
            if (saisonOuverte) {
                const joursRestants = differenceInCalendarDays(saisonOuverte.dateFin, new Date());
                if (joursRestants >= 0 && joursRestants <= 15) {
                    alerts.push({
                        code: "saisonProcheFin",
                        severity: "warning",
                        message: t("dashboard.alerts.saisonProcheFin", {
                            nom: saisonOuverte.nom,
                            jours: String(joursRestants),
                        }),
                        href: ROUTES.SAISONS,
                    });
                }
            } else {
                alerts.push({
                    code: "aucuneSaisonOuverte",
                    severity: "danger",
                    message: t("dashboard.alerts.aucuneSaisonOuverte"),
                    href: ROUTES.SAISONS,
                });
            }

            if (filters.periode === "saison" && filters.saisonId) {
                const saisonSelectionnee = await saisonRepository.findById(tenantId, filters.saisonId);
                if (saisonSelectionnee?.statut === "CLOTUREE") {
                    alerts.push({
                        code: "saisonSelectionneeCloturee",
                        severity: "info",
                        message: t("dashboard.alerts.saisonSelectionneeCloturee", { nom: saisonSelectionnee.nom }),
                        href: ROUTES.SAISON(saisonSelectionnee.id),
                    });
                }
            }
        }

        return alerts;
    },

    async getActiveSaison(tenantId: string) {
        if (!(await hasPermission("saison:read"))) return null;
        return saisonService.getOuverte(tenantId);
    },
};
