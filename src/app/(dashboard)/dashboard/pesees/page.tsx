import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { parseQueryParams, type RawSearchParams } from "@/lib/pagination";
import { peseeService } from "@/services/pesee.service";
import { PeseesPageContent } from "./PeseesPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("pesees.title")} — ${t("common.appName")}`,
    };
}

export default async function PeseesPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!await hasPermission("pesee:read")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const params = await searchParams;
    const saisonParam = Array.isArray(params.saisonId) ? params.saisonId[0] : params.saisonId;
    const { saisonId, saisonFiltre } = await getSaisonFiltrePourPage(tenantId, saisonParam);

    const { page, pageSize, search, sortBy, sortDir } = parseQueryParams(params);
    const { resultat, totaux } = await peseeService.getPageParLivraison(tenantId, {
        page,
        pageSize,
        search,
        sortBy,
        sortDir,
        saisonId,
    });

    return <PeseesPageContent resultat={resultat} totaux={totaux} saisonFiltre={saisonFiltre} />;
}
