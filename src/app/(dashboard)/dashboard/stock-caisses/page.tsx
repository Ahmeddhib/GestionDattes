import { Suspense } from "react";
import { getPretsAction, getPretsStatistiquesAction } from "@/actions/prets-caisses/get-prets.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { StatsCards } from "@/components/features/stock-caisses/StatsCards";
import { PretsTable } from "@/components/features/stock-caisses/PretsTable";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { LowStockAlert } from "@/components/features/stock-caisses/LowStockAlert";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import { SaisonFilterBar } from "@/components/shared/SaisonFilterBar";
import { StockCaissesContent } from "./StockCaissesContent";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { PageContainer } from "@/components/shared/PageContainer";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";

export default async function StockCaissesPage({
    searchParams,
}: {
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const t = await getServerTranslations();

    const tenantId = await getTenantId();
    const { saisonId: saisonParam } = await searchParams;
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        saisonParam
    );

    const [statsResult, pretsResult, typesCaissesResult, pdfBranding] = await Promise.all([
        // Les statistiques et le stock par type restent des instantanés
        // physiques globaux : des caisses prêtées lors d'une campagne
        // précédente et jamais rendues sont toujours dehors aujourd'hui.
        getPretsStatistiquesAction(),
        getPretsAction({ saisonId }),
        getTypesCaissesAction(),
        getTenantPdfBranding(tenantId),
    ]);

    const stats = statsResult.success ? statsResult.data : null;
    const prets = pretsResult.success ? pretsResult.data : [];
    const typesCaisses = typesCaissesResult.success ? (typesCaissesResult.data || []) : [];


    return (
        <PageContainer>
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
                {!saisonFiltre.isReadOnly && saisonOuverte && (
                    <CreatePretDialog saisonActive={saisonOuverte} />
                )}
            </div>

            <SaisonFilterBar {...saisonFiltre} />

            {!saisonOuverte && <AucuneSaisonAlert canGererSaisons />}

            {/* Alerte Stock Faible */}
            <LowStockAlert typesCaisses={typesCaisses} />

            {/* Stats - Mobile Responsive */}
            {stats && <StatsCards stats={stats} />}

            {/* Tableau Stock par Type - Mobile Responsive with Client Component */}
            <StockCaissesContent typesCaisses={typesCaisses} />

            {/* Tableau Prêts - Mobile Responsive */}
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <div className="overflow-x-auto">
                    <PretsTable prets={prets} branding={pdfBranding} />
                </div>
            </Suspense>
        </PageContainer>
    );
}
