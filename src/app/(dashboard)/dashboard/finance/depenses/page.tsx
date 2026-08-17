import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getDepensesPageAction } from "@/actions/depenses/get-depenses-page.action";
import { parseQueryParams, type RawSearchParams } from "@/lib/pagination";
import { DepensesPageContent } from "./DepensesPageContent";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.depenses.title")} — ${t("common.appName")}`,
    };
}

export default async function DepensesPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const tenantId = await getTenantId();
    const params = await searchParams;
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        typeof params.saisonId === "string" ? params.saisonId : undefined
    );

    const query = parseQueryParams(params, { sortBy: "dateDepense", sortDir: "desc" });

    const [result, pdfBranding] = await Promise.all([
        getDepensesPageAction({ ...query, saisonId }),
        getTenantPdfBranding(tenantId),
    ]);

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des dépenses");
    }

    return (
        <DepensesPageContent
            resultat={result.data.resultat}
            totaux={result.data.totaux}
            saisonFiltre={saisonFiltre}
            saisonOuverte={saisonOuverte}
            branding={pdfBranding}
        />
    );
}
