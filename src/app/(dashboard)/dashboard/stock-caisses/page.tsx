import { Suspense } from "react";
import { getPretsPageAction } from "@/actions/prets-caisses/get-prets-page.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { PretsTableServer } from "@/components/features/stock-caisses/PretsTableServer";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { AucuneSaisonAlert } from "@/components/features/saisons/AucuneSaisonAlert";
import { SaisonFilterBar } from "@/components/shared/SaisonFilterBar";
import { StockCaissesWorkspace } from "@/components/features/stock-caisses/StockCaissesWorkspace";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { parseQueryParams, parseBorneDate, type RawSearchParams } from "@/lib/pagination";
import { PageContainer } from "@/components/shared/PageContainer";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import {
    getCaisseStockOverviewAction,
    getMouvementsCaissesPageAction,
    getReceptionsCaissesPageAction,
    getStocksClientsPageAction,
} from "@/actions/stock-caisses/caisse-stock.actions";
import type { TypeMouvementCaisse } from "@/generated/prisma";
import { hasPermission } from "@/lib/permissions";

const TYPES_MOUVEMENT = new Set<TypeMouvementCaisse>([
    "RECEPTION_CLIENT", "ANNULATION_RECEPTION", "SORTIE_VENTE", "PRET_AGRICULTEUR",
    "RETOUR_AGRICULTEUR", "ANNULATION_RETOUR_AGRICULTEUR", "AJUSTEMENT",
]);

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
    const [canCreatePret, canCreateReception, canCancelReception, canReadMovements, canAdjustStock] = await Promise.all([
        hasPermission("pret-caisse:create"),
        hasPermission("caisse:reception:create"),
        hasPermission("caisse:reception:cancel"),
        hasPermission("caisse:movement:read"),
        hasPermission("caisse:adjust"),
    ]);

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
    const typeMouvementBrut = typeof params.typeMouvement === "string" ? params.typeMouvement as TypeMouvementCaisse : undefined;
    const typeMouvement = typeMouvementBrut && TYPES_MOUVEMENT.has(typeMouvementBrut) ? typeMouvementBrut : undefined;
    const clientId = typeof params.clientId === "string" && params.clientId !== "tous" ? params.clientId : undefined;
    const proprietaire = params.proprietaire === "WAKALA" || params.proprietaire === "CLIENT"
        ? params.proprietaire
        : undefined;

    const [pretsResult, typesCaissesResult, pdfBranding, overviewResult, stocksClientsResult, receptionsResult, mouvementsResult, clientsResult] = await Promise.all([
        // Les statistiques et le stock par type restent des instantanés
        // physiques globaux : des caisses prêtées lors d'une campagne
        // précédente et jamais rendues sont toujours dehors aujourd'hui.
        getPretsPageAction({ ...query, saisonId, filtres }),
        getTypesCaissesAction(),
        getTenantPdfBranding(tenantId),
        getCaisseStockOverviewAction(),
        getStocksClientsPageAction({ page: query.page, pageSize: query.pageSize, search: query.search, clientId, typeCaisseId: filtres.typeCaisseId }),
        getReceptionsCaissesPageAction({ ...query, clientId, from: filtres.from, to: filtres.to }),
        canReadMovements
            ? getMouvementsCaissesPageAction({ ...query, clientId, typeCaisseId: filtres.typeCaisseId, proprietaire, type: typeMouvement, from: filtres.from, to: filtres.to })
            : Promise.resolve({ success: true as const, data: { items: [], currentPage: 1, pageSize: query.pageSize, totalItems: 0, totalPages: 1 } }),
        getClientsAction(),
    ]);

    const typesCaisses = typesCaissesResult.success ? (typesCaissesResult.data || []) : [];

    if (!pretsResult.success) {
        throw new Error(pretsResult.error || "Erreur lors du chargement des prêts");
    }
    if (!overviewResult.success) throw new Error(overviewResult.error);
    const emptyPage = { items: [], currentPage: 1, pageSize: query.pageSize, totalItems: 0, totalPages: 1 };


    return (
        <PageContainer>
            {/* Header - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {t('nav.stockCaisses')}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        {t('pretsCaisses.description')}
                    </p>
                </div>
                {!saisonFiltre.isReadOnly && saisonOuverte && canCreatePret && (
                    <CreatePretDialog saisonActive={saisonOuverte} />
                )}
            </div>

            <SaisonFilterBar {...saisonFiltre} />

            {!saisonOuverte && <AucuneSaisonAlert canGererSaisons />}

            {/* Alerte Stock Faible */}
            <StockCaissesWorkspace
                key={overviewResult.data.parType.map((type) => `${type.id}:${type.quantiteWakala}:${type.quantiteClients}`).join("|")}
                overview={overviewResult.data}
                stocksClients={stocksClientsResult.success ? stocksClientsResult.data : emptyPage}
                receptions={receptionsResult.success ? receptionsResult.data : emptyPage}
                mouvements={mouvementsResult.success ? mouvementsResult.data : emptyPage}
                clients={clientsResult.success ? (clientsResult.data || []) : []}
                typesCaisses={typesCaisses.map((type) => ({ id: type.id, nom: type.nom }))}
                branding={pdfBranding}
                permissions={{ canCreateReception, canCancelReception, canReadMovements, canAdjustStock }}
                pretsContent={
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
                }
            />
        </PageContainer>
    );
}
