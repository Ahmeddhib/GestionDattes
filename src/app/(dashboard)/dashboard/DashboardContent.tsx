import { Suspense } from "react";
import { dashboardService } from "@/services/dashboard.service";
import { financeService } from "@/services/finance.service";
import type { DashboardFiltersValue, TrendPoint } from "@/types/dashboard";
import { DashboardHeader } from "@/components/features/dashboard/DashboardHeader";
import { DashboardFilters } from "@/components/features/dashboard/DashboardFilters";
import { KpiCardGrid } from "@/components/features/dashboard/KpiCard";
import { ActivityTrendChart } from "@/components/features/dashboard/ActivityTrendChart";
import { StockByDateTypeChart } from "@/components/features/dashboard/StockByDateTypeChart";
import { TopAgriculteursTable } from "@/components/features/dashboard/TopAgriculteursTable";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { DashboardAlerts } from "@/components/features/dashboard/DashboardAlerts";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import { FinancialSummary } from "@/components/features/dashboard/FinancialSummary";
import { KpiGridSkeleton, ChartCardSkeleton, TableCardSkeleton, AlertsSkeleton } from "@/components/features/dashboard/DashboardSkeletons";
import { getServerTranslations } from "@/i18n/server";

interface Saison { id: string; nom: string }

interface DashboardPermissions {
    canLivraison: boolean;
    canVente: boolean;
    canPaiementAgriculteur: boolean;
    canEncaissementClient: boolean;
    canDepense: boolean;
    canStock: boolean;
    canFinance: boolean;
    canSaison: boolean;
}

interface DashboardContentProps {
    tenantId: string;
    userName: string;
    wakalaName: string;
    filters: DashboardFiltersValue;
    saisons: Saison[];
    saisonActive: { nom: string; statut: string; dateFin: Date } | null;
    permissions: DashboardPermissions;
}

async function getPeriodShortLabel(periode: DashboardFiltersValue["periode"]): Promise<string> {
    const t = await getServerTranslations();
    const key = ({
        jour: "jour",
        semaine: "semaine",
        mois: "mois",
        annee: "annee",
        saison: "saisonOption",
        personnalisee: "personnalisee",
    })[periode];
    return t(`dashboard.filters.${key}`);
}

async function KpiSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const kpis = await dashboardService.getKpis(tenantId, filters);
    const order = ["stockTotal", "quantiteNetteLivree", "chiffreAffaires", "tresorerieNette", "dettesAgriculteurs", "creancesClients"];
    return <KpiCardGrid kpis={order.map((code) => kpis.find((kpi) => kpi.code === code)).filter((kpi) => kpi !== undefined)} />;
}

function mergeTrendPoints(...series: TrendPoint[][]): TrendPoint[] {
    const rows = new Map<string, TrendPoint>();
    for (const points of series) {
        for (const point of points) {
            rows.set(point.periode, { ...(rows.get(point.periode) ?? { periode: point.periode }), ...point });
        }
    }
    return Array.from(rows.values());
}

async function ActivitySection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const [livraisons, ventes, finance] = await Promise.all([
        dashboardService.getDeliveriesTrend(tenantId, filters),
        dashboardService.getSalesTrend(tenantId, filters),
        dashboardService.getCashFlowTrend(tenantId, filters),
    ]);
    return <ActivityTrendChart data={mergeTrendPoints(livraisons, ventes, finance)} />;
}

async function StockSection({ tenantId }: { tenantId: string }) {
    return <StockByDateTypeChart data={await dashboardService.getStockByType(tenantId)} />;
}

async function TopAgriculteursSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const [data, periodLabel] = await Promise.all([
        dashboardService.getTopAgriculteurs(tenantId, filters),
        getPeriodShortLabel(filters.periode),
    ]);
    return <TopAgriculteursTable data={data} periodLabel={periodLabel} />;
}

async function RecentActivitySection({ tenantId }: { tenantId: string }) {
    return <RecentActivity sections={await dashboardService.getRecentActivity(tenantId)} />;
}

async function AlertsSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    return <DashboardAlerts alerts={await dashboardService.getAlerts(tenantId, filters)} />;
}

async function FinanceSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const [bilan, periodLabel] = await Promise.all([
        financeService.getBilanGlobal(tenantId, filters),
        getPeriodShortLabel(filters.periode),
    ]);
    return <FinancialSummary bilan={bilan} periodLabel={periodLabel} />;
}

export function DashboardContent({
    tenantId,
    userName,
    wakalaName,
    filters,
    saisons,
    saisonActive,
    permissions,
}: DashboardContentProps) {
    const quickActionPermissions = {
        canLivraison: permissions.canLivraison,
        canVente: permissions.canVente,
        canPaiementAgriculteur: permissions.canPaiementAgriculteur,
        canEncaissementClient: permissions.canEncaissementClient,
        canDepense: permissions.canDepense,
        canStock: permissions.canStock,
        canFinance: permissions.canFinance,
    };

    return (
        <div className="dashboard-premium relative min-h-full w-full min-w-0 overflow-hidden text-[#f8f1e4]">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[url('/dashboard-date-palm-bg.png')] bg-[length:1600px_auto] bg-top bg-no-repeat opacity-15 dark:opacity-35" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_-10%,rgba(193,122,43,0.12),transparent_35%),linear-gradient(180deg,rgba(246,241,232,0.72),#f6f1e8_42%)] dark:bg-[radial-gradient(circle_at_48%_-10%,rgba(132,77,24,0.20),transparent_35%),linear-gradient(180deg,rgba(8,7,5,0.68),#0b0907_42%)]" />

            <div className="relative mx-auto w-full max-w-[1800px] space-y-4 px-3 py-4 sm:px-5 lg:px-6 2xl:px-8">
                <div className="dashboard-card relative overflow-hidden rounded-2xl border px-4 py-5 sm:px-6">
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,252,247,.94)_0%,rgba(255,252,247,.74)_48%,rgba(255,252,247,.20)_100%),url('/dashboard-date-palm-bg.png')] bg-cover bg-center opacity-95 dark:bg-[linear-gradient(90deg,rgba(10,8,6,.94)_0%,rgba(10,8,6,.72)_48%,rgba(10,8,6,.14)_100%),url('/dashboard-date-palm-bg.png')]" />
                    <div className="relative">
                        <DashboardHeader
                            userName={userName}
                            wakalaName={wakalaName}
                            saisonActive={saisonActive}
                            canSeeSaison={permissions.canSaison}
                            filters={<DashboardFilters saisons={saisons} currentPeriode={filters.periode} currentSaisonId={filters.saisonId} />}
                        />
                    </div>
                </div>

                <Suspense fallback={<KpiGridSkeleton />}>
                    <KpiSection tenantId={tenantId} filters={filters} />
                </Suspense>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-8">
                        <Suspense fallback={<ChartCardSkeleton />}>
                            <ActivitySection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    </div>
                    <div className="space-y-4 xl:col-span-4">
                        {permissions.canStock && (
                            <Suspense fallback={<ChartCardSkeleton />}>
                                <StockSection tenantId={tenantId} />
                            </Suspense>
                        )}
                        <Suspense fallback={<AlertsSkeleton />}>
                            <AlertsSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {permissions.canFinance && (
                        <Suspense fallback={<TableCardSkeleton />}>
                            <FinanceSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                    {permissions.canLivraison && (
                        <Suspense fallback={<TableCardSkeleton />}>
                            <TopAgriculteursSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                    <Suspense fallback={<TableCardSkeleton />}>
                        <RecentActivitySection tenantId={tenantId} />
                    </Suspense>
                    <QuickActions permissions={quickActionPermissions} />
                </div>
            </div>
        </div>
    );
}
