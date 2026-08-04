import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getVentesAction } from "@/actions/ventes/get-ventes.action";
import { VentesPageContent } from "./VentesPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.ventes.title")} — ${t("common.appName")}`,
    };
}

export default async function VentesPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const result = await getVentesAction();

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des ventes");
    }

    return <VentesPageContent ventes={result.data || []} />;
}
