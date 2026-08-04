import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getDepensesAction } from "@/actions/depenses/get-depenses.action";
import { DepensesPageContent } from "./DepensesPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.depenses.title")} — ${t("common.appName")}`,
    };
}

export default async function DepensesPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const result = await getDepensesAction();

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des dépenses");
    }

    return <DepensesPageContent depenses={result.data || []} />;
}
