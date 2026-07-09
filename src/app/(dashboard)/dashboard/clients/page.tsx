import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { ClientsPageContent } from "./ClientsPageContent";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const t = await getServerTranslations();
    return {
        title: `${t("clients.title")} — ${t("common.appName")}`,
    };
}

export default async function ClientsPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const result = await getClientsAction();

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des clients");
    }

    return <ClientsPageContent clients={result.data || []} />;
}
