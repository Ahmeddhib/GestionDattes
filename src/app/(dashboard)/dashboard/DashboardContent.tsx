import { Suspense } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardFiltersValue } from "@/types/dashboard";
import { DashboardHeader } from "@/components/features/dashboard/DashboardHeader";
import { DashboardFilters } from "@/components/features/dashboard/DashboardFilters";
import { KpiCardGrid } from "@/components/features/dashboard/KpiCard";
import { DeliveriesTrendChart } from "@/components/features/dashboard/DeliveriesTrendChart";
import { CashFlowChart } from "@/components/features/dashboard/CashFlowChart";
import { StockByDateTypeChart } from "@/components/features/dashboard/StockByDateTypeChart";
import { LivraisonsRepartitionChart } from "@/components/features/dashboard/LivraisonsRepartitionChart";
import { SalesTrendChart } from "@/components/features/dashboard/SalesTrendChart";
import { TopAgriculteursTable } from "@/components/features/dashboard/TopAgriculteursTable";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { DashboardAlerts } from "@/components/features/dashboard/DashboardAlerts";
import { QuickActions } from "@/components/features/dashboard/QuickActions";
import {
    KpiGridSkeleton,
    ChartCardSkeleton,
    TableCardSkeleton,
    AlertsSkeleton,
} from "@/components/features/dashboard/DashboardSkeletons";

interface Saison {
    id: string;
    nom: string;
}

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
    wakalaName: string;
    filters: DashboardFiltersValue;
    saisons: Saison[];
    saisonActive: { nom: string; statut: string; dateFin: Date } | null;
    permissions: DashboardPermissions;
}

async function KpiSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const kpis = await dashboardService.getKpis(tenantId, filters);
    return <KpiCardGrid kpis={kpis} />;
}

async function DeliveriesSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const data = await dashboardService.getDeliveriesTrend(tenantId, filters);
    return <DeliveriesTrendChart data={data} />;
}

async function CashFlowSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const data = await dashboardService.getCashFlowTrend(tenantId, filters);
    return <CashFlowChart data={data} />;
}

async function StockSection({ tenantId }: { tenantId: string }) {
    const data = await dashboardService.getStockByType(tenantId);
    return <StockByDateTypeChart data={data} />;
}

async function RepartitionSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const data = await dashboardService.getLivraisonsRepartition(tenantId, filters);
    return <LivraisonsRepartitionChart data={data} />;
}

async function SalesSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const data = await dashboardService.getSalesTrend(tenantId, filters);
    return <SalesTrendChart data={data} />;
}

async function TopAgriculteursSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const data = await dashboardService.getTopAgriculteurs(tenantId, filters);
    return <TopAgriculteursTable data={data} />;
}

async function RecentActivitySection({ tenantId }: { tenantId: string }) {
    const sections = await dashboardService.getRecentActivity(tenantId);
    return <RecentActivity sections={sections} />;
}

async function AlertsSection({ tenantId, filters }: { tenantId: string; filters: DashboardFiltersValue }) {
    const alerts = await dashboardService.getAlerts(tenantId, filters);
    return <DashboardAlerts alerts={alerts} />;
}

export function DashboardContent({
    tenantId,
    wakalaName,
    filters,
    saisons,
    saisonActive,
    permissions,
}: DashboardContentProps) {
    return (
        <div className="mx-auto min-h-full w-full min-w-0 max-w-[1760px] bg-[#FAF0DC] px-3 py-4 dark:bg-[#1A0F00] sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            <DashboardHeader
                wakalaName={wakalaName}
                saisonActive={saisonActive}
                canSeeSaison={permissions.canSaison}
                filters={<DashboardFilters saisons={saisons} currentPeriode={filters.periode} currentSaisonId={filters.saisonId} />}
            >
                <QuickActions
                    permissions={{
                        canLivraison: permissions.canLivraison,
                        canVente: permissions.canVente,
                        canPaiementAgriculteur: permissions.canPaiementAgriculteur,
                        canEncaissementClient: permissions.canEncaissementClient,
                        canDepense: permissions.canDepense,
                        canStock: permissions.canStock,
                        canFinance: permissions.canFinance,
                    }}
                />
            </DashboardHeader>

            <div className="space-y-6">
                <Suspense fallback={<KpiGridSkeleton />}>
                    <KpiSection tenantId={tenantId} filters={filters} />
                </Suspense>

                <Suspense fallback={<AlertsSkeleton />}>
                    <AlertsSection tenantId={tenantId} filters={filters} />
                </Suspense>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {permissions.canLivraison && (
                        <Suspense fallback={<ChartCardSkeleton />}>
                            <DeliveriesSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                    {permissions.canFinance && (
                        <Suspense fallback={<ChartCardSkeleton />}>
                            <CashFlowSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                    {permissions.canStock && (
                        <Suspense fallback={<ChartCardSkeleton />}>
                            <StockSection tenantId={tenantId} />
                        </Suspense>
                    )}
                    {permissions.canLivraison && (
                        <Suspense fallback={<ChartCardSkeleton />}>
                            <RepartitionSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                </div>

                {permissions.canVente && (
                    <Suspense fallback={<ChartCardSkeleton />}>
                        <SalesSection tenantId={tenantId} filters={filters} />
                    </Suspense>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {permissions.canLivraison && (
                        <Suspense fallback={<TableCardSkeleton />}>
                            <TopAgriculteursSection tenantId={tenantId} filters={filters} />
                        </Suspense>
                    )}
                    <Suspense fallback={<TableCardSkeleton />}>
                        <RecentActivitySection tenantId={tenantId} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
