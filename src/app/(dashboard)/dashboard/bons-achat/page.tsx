import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { bonAchatService } from "@/services/bon-achat.service";
import { getBonsAchatPageAction } from "@/actions/bons-achat/get-bons-achat-page.action";
import { parseQueryParams, parseBorneDate, type RawSearchParams } from "@/lib/pagination";
import { BonsAchatPageContent } from "./BonsAchatPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("bonAchat.title")} — ${t("common.appName")}`,
    };
}

export default async function BonsAchatPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!(await hasPermission("bon-achat:read"))) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const params = await searchParams;
    const { saisonId, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        typeof params.saisonId === "string" ? params.saisonId : undefined
    );

    const query = parseQueryParams(params, { sortBy: "createdAt", sortDir: "desc" });

    // Filtres propres au module, désormais appliqués en base : les appliquer
    // dans le tableau ne filtrerait plus qu'une page.
    const filtres = {
        agriculteurId:
            typeof params.agriculteurId === "string" && params.agriculteurId !== "tous"
                ? params.agriculteurId
                : undefined,
        from: parseBorneDate(params.from, "debut"),
        to: parseBorneDate(params.to, "fin"),
    };

    const [result, tenant] = await Promise.all([
        getBonsAchatPageAction({ ...query, saisonId, filtres }),
        bonAchatService.getTenantInfo(tenantId),
    ]);

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des bons d'achat");
    }

    return (
        <BonsAchatPageContent
            resultat={result.data.resultat}
            totaux={result.data.totaux}
            agriculteurs={result.data.agriculteurs}
            tenant={tenant}
            saisonFiltre={saisonFiltre}
        />
    );
}
