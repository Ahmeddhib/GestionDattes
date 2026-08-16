import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
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
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!await hasPermission("pesee:read")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const { saisonId: saisonParam } = await searchParams;
    const { saisonId, saisonFiltre } = await getSaisonFiltrePourPage(tenantId, saisonParam);

    const pesees = await peseeService.getAll(tenantId, session.user.id, { saisonId });

    return <PeseesPageContent pesees={pesees} saisonFiltre={saisonFiltre} />;
}
