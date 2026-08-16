import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getDepensesAction } from "@/actions/depenses/get-depenses.action";
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
        getDepensesAction({ saisonId }),
        getTenantPdfBranding(tenantId),
    ]);

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des dépenses");
    }

    return (
        <DepensesPageContent
            depenses={result.data || []}
            saisonFiltre={saisonFiltre}
            saisonOuverte={saisonOuverte}
            branding={pdfBranding}
        />
    );
}
