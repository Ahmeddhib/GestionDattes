import { Suspense } from "react";
import { getPretsAction, getPretsStatistiquesAction } from "@/actions/prets-caisses/get-prets.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { StatsCards } from "@/components/features/stock-caisses/StatsCards";
import { PretsTable } from "@/components/features/stock-caisses/PretsTable";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { LowStockAlert } from "@/components/features/stock-caisses/LowStockAlert";
import { StockCaissesContent } from "./StockCaissesContent";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerTranslations } from "@/i18n/server";

export default async function StockCaissesPage() {
    const t = await getServerTranslations();

    const [statsResult, pretsResult, typesCaissesResult] = await Promise.all([
        getPretsStatistiquesAction(),
        getPretsAction(),
        getTypesCaissesAction(),
    ]);

    const stats = statsResult.success ? statsResult.data : null;
    const prets = pretsResult.success ? pretsResult.data : [];
    const typesCaisses = typesCaissesResult.success ? (typesCaissesResult.data || []) : [];

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#3D1C00]">
                        {t('nav.stockCaisses')}
                    </h1>
                    <p className="text-sm md:text-base text-[#3D1C00]/60">
                        {t('pretsCaisses.description')}
                    </p>
                </div>
                <CreatePretDialog />
            </div>

            {/* Alerte Stock Faible */}
            <LowStockAlert typesCaisses={typesCaisses} />

            {/* Stats - Mobile Responsive */}
            {stats && <StatsCards stats={stats} />}

            {/* Tableau Stock par Type - Mobile Responsive with Client Component */}
            <StockCaissesContent typesCaisses={typesCaisses} />

            {/* Tableau Prêts - Mobile Responsive */}
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <div className="overflow-x-auto">
                    <PretsTable prets={prets} />
                </div>
            </Suspense>
        </div>
    );
}
