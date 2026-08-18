import { Suspense } from "react";
import { getPretsStatistiquesAction } from "@/actions/prets-caisses/get-prets.action";
import { getPretsPageAction } from "@/actions/prets-caisses/get-prets-page.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { StatsCards } from "@/components/features/stock-caisses/StatsCards";
import { PretsTableServer } from "@/components/features/stock-caisses/PretsTableServer";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { LowStockAlert } from "@/components/features/stock-caisses/LowStockAlert";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import { SaisonFilterBar } from "@/components/shared/SaisonFilterBar";
import { StockCaissesContent } from "./StockCaissesContent";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { parseQueryParams, parseBorneDate, type RawSearchParams } from "@/lib/pagination";
import { PageContainer } from "@/components/shared/PageContainer";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";

/** Statut validé. Absent ⇒ `EN_COURS`, le défaut historique du tableau. */
function parseStatut(
    brut: string | string[] | undefined
): "EN_COURS" | "RETOURNE" | "INCOMPLET" | undefined {
    const valeur = Array.isArray(brut) ? brut[0] : brut;
    if (valeur === "tous") return undefined;
    if (valeur === "EN_COURS" || valeur === "RETOURNE" || valeur === "INCOMPLET") return valeur;
    return "EN_COURS";
}

export default async function StockCaissesPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const t = await getServerTranslations();

    const tenantId = await getTenantId();
    const params = await searchParams;
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        typeof params.saisonId === "string" ? params.saisonId : undefined
    );

    const query = parseQueryParams(params, { sortBy: "datePreT", sortDir: "desc" });

    // Filtres du module, désormais appliqués en base : les appliquer dans le
    // tableau ne filtrerait plus qu'une page.
    const filtres = {
        agriculteurId:
            typeof params.agriculteurId === "string" && params.agriculteurId !== "tous"
                ? params.agriculteurId
                : undefined,
        typeCaisseId:
            typeof params.typeCaisseId === "string" && params.typeCaisseId !== "tous"
                ? params.typeCaisseId
                : undefined,
        statut: parseStatut(params.statut),
        from: parseBorneDate(params.from, "debut"),
        to: parseBorneDate(params.to, "fin"),
    };

    const [statsResult, pretsResult, typesCaissesResult, pdfBranding] = await Promise.all([
        // Les statistiques et le stock par type restent des instantanés
        // physiques globaux : des caisses prêtées lors d'une campagne
        // précédente et jamais rendues sont toujours dehors aujourd'hui.
        getPretsStatistiquesAction(),
        getPretsPageAction({ ...query, saisonId, filtres }),
        getTypesCaissesAction(),
        getTenantPdfBranding(tenantId),
    ]);

    const stats = statsResult.success ? statsResult.data : null;
    const typesCaisses = typesCaissesResult.success ? (typesCaissesResult.data || []) : [];

    if (!pretsResult.success) {
        throw new Error(pretsResult.error || "Erreur lors du chargement des prêts");
    }


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
            <Suspense fallback={<Skeleton className="h-100" />}>
                <div className="overflow-x-auto">
                    <PretsTableServer
                        resultat={pretsResult.data.resultat}
                        agriculteurs={pretsResult.data.agriculteurs}
                        typesCaisses={pretsResult.data.typesCaisses}
                        branding={pdfBranding}
                    />
                </div>
            </Suspense>
        </PageContainer>
    );
}
