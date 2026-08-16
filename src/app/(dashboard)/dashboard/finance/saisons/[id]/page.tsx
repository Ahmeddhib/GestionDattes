import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { hasPermission } from "@/lib/permissions";
import { getServerTranslations } from "@/i18n/server";
import { getSaisonDetailAction } from "@/actions/saisons/get-saison-detail.action";
import { SaisonDetailContent, type BilanSaisonData } from "./SaisonDetailContent";
import { SaisonDetailHeader } from "./SaisonDetailHeader";
import { SaisonTabsNav } from "./SaisonTabsNav";
import { SaisonOnglet } from "./SaisonOnglet";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";
import { PageContainer } from "@/components/shared/PageContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { parseOngletSaison } from "@/lib/saison-onglets";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.saisons.bilan.title")} — ${t("common.appName")}`,
    };
}

type StockParTypeDate = { typeDateId: string; nom: string; quantiteDisponible: number }[];
type StockCaisses = {
    typeCaisseId: string;
    nom: string;
    nombrePrete: number;
    nombreRetourne: number;
    nombreNonRetourne: number;
}[];

export default async function SaisonDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const { id } = await params;
    const { tab } = await searchParams;
    const onglet = parseOngletSaison(tab);

    const result = await getSaisonDetailAction(id);

    if (!result.success || !result.data) {
        throw new Error(result.error || "Erreur lors du chargement de la saison");
    }

    const tenantId = await getTenantId();
    const [canGenererProvisoire, canCloturer, pdfBranding] = await Promise.all([
        hasPermission("saison:bilan-provisoire"),
        hasPermission("saison:cloturer"),
        getTenantPdfBranding(tenantId),
    ]);

    // Les colonnes Json de Prisma remontent en `JsonValue` : on les remet dans
    // leur forme métier ici, à la frontière serveur, pour que le composant
    // client reçoive des données déjà typées.
    const bilans: BilanSaisonData[] = result.data.bilans.map((b) => ({
        ...b,
        genereParNom: b.User?.name ?? b.User?.email ?? null,
        stockFinalParTypeDate: b.stockFinalParTypeDate as unknown as StockParTypeDate,
        stockCaisses: b.stockCaisses as unknown as StockCaisses,
        stockEntreParTypeDate: b.stockEntreParTypeDate as unknown as StockParTypeDate,
        stockOrigineRestantParTypeDate: b.stockOrigineRestantParTypeDate as unknown as StockParTypeDate,
        caissesSaison: b.caissesSaison as unknown as StockCaisses,
    }));

    return (
        <PageContainer>
            <SaisonDetailHeader
                saison={result.data.saison}
                canGenererProvisoire={canGenererProvisoire}
                canCloturer={canCloturer}
            />

            <SaisonTabsNav saisonId={id} actif={onglet} />

            {onglet === "apercu" ? (
                <SaisonDetailContent
                    // Remonte l'aperçu quand un nouveau bilan apparaît, pour que
                    // la sélection de version reparte sur celui-ci.
                    key={bilans[0]?.id ?? "aucun"}
                    saison={result.data.saison}
                    bilans={bilans}
                    branding={pdfBranding}
                />
            ) : (
                // `key` sur l'onglet : sans elle, React réutiliserait la même
                // frontière Suspense d'un onglet à l'autre et afficherait les
                // données précédentes au lieu du squelette pendant le chargement.
                <Suspense key={onglet} fallback={<Skeleton className="h-105 w-full" />}>
                    <SaisonOnglet onglet={onglet} saisonId={id} />
                </Suspense>
            )}
        </PageContainer>
    );
}
