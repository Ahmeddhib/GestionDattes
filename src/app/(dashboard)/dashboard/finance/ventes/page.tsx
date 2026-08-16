import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getVentesAction } from "@/actions/ventes/get-ventes.action";
import { VentesPageContent } from "./VentesPageContent";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.ventes.title")} — ${t("common.appName")}`,
    };
}

export default async function VentesPage({
    searchParams,
}: {
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const tenantId = await getTenantId();
    const { saisonId: saisonParam } = await searchParams;
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        saisonParam
    );

    const [result, pdfBranding] = await Promise.all([
        getVentesAction({ saisonId }),
        getTenantPdfBranding(tenantId),
    ]);

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des ventes");
    }

    return (
        <VentesPageContent
            ventes={result.data || []}
            saisonFiltre={saisonFiltre}
            saisonOuverte={saisonOuverte}
            branding={pdfBranding}
        />
    );
}
