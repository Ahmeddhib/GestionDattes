import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { hasPermission } from "@/lib/permissions";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { bonAchatService } from "@/services/bon-achat.service";
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
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    if (!await hasPermission("bon-achat:read")) {
        redirect(ROUTES.UNAUTHORIZED);
    }

    const tenantId = getTenantFromSession(session);
    const { saisonId: saisonParam } = await searchParams;
    const { saisonId, saisonFiltre } = await getSaisonFiltrePourPage(tenantId, saisonParam);

    const [bonsAchat, tenant] = await Promise.all([
        bonAchatService.getAll(tenantId, { saisonId }),
        bonAchatService.getTenantInfo(tenantId),
    ]);

    return (
        <BonsAchatPageContent bonsAchat={bonsAchat} tenant={tenant} saisonFiltre={saisonFiltre} />
    );
}
