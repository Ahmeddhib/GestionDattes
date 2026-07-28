import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { stockDateService } from "@/services/stock-date.service";
import { StockDattesPageContent } from "./StockDattesPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("stockDattes.title")} — ${t("common.appName")}`,
    };
}

export default async function StockDattesPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!await hasPermission("stock-date:read")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const stockDates = await stockDateService.getAll(tenantId);

    return <StockDattesPageContent stockDates={stockDates} />;
}
