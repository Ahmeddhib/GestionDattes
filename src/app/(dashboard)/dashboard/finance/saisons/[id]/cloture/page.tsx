import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getClotureApercuAction } from "@/actions/saisons/get-cloture-apercu.action";
import { ClotureSaisonContent } from "./ClotureSaisonContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.saisons.cloture.title")} — ${t("common.appName")}`,
    };
}

export default async function ClotureSaisonPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const { id } = await params;
    const result = await getClotureApercuAction(id);

    if (!result.success || !result.data) {
        // La saison n'est plus OUVERTE (déjà clôturée entre-temps, ex. retour
        // arrière du navigateur après une clôture réussie) ou introuvable —
        // rediriger vers la fiche détail plutôt que de crasher la page.
        redirect(`/dashboard/finance/saisons/${id}`);
    }

    return <ClotureSaisonContent apercu={result.data} />;
}
