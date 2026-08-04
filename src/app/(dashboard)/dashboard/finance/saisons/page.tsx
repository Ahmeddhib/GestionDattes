import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getSaisonsAction } from "@/actions/saisons/get-saisons.action";
import { SaisonsPageContent } from "./SaisonsPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.saisons.title")} — ${t("common.appName")}`,
    };
}

export default async function SaisonsPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const result = await getSaisonsAction();

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des saisons");
    }

    return <SaisonsPageContent saisons={result.data || []} />;
}
