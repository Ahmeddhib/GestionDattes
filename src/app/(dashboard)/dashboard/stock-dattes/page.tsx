import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { stockDateService } from "@/services/stock-date.service";
import { StockDattesPageContent } from "./StockDattesPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("stockDattes.title")} — ${t("common.appName")}`,
    };
}

export default async function StockDattesPage({
    searchParams,
}: {
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!await hasPermission("stock-date:read")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const { saisonId: saisonParam } = await searchParams;
    // Ici `saisonId` filtre sur la saison d'ORIGINE des lots (saisonOrigineId) :
    // un lot entré en saison A reste rattaché à A même vendu pendant la saison B.
    const { saisonId, saisonFiltre } = await getSaisonFiltrePourPage(tenantId, saisonParam);

    const stockDates = await stockDateService.getGroupes(tenantId, { saisonId });

    return (
        <StockDattesPageContent
            stockDates={stockDates}
            saisonFiltre={saisonFiltre}
            saisonId={saisonId}
        />
    );
}
