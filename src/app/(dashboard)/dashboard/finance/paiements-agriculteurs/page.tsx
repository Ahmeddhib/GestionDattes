import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getBonsAchatAvecSoldeAction } from "@/actions/paiements-agriculteurs/get-bons-achat-avec-solde.action";
import { PaiementsAgriculteursPageContent } from "./PaiementsAgriculteursPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.paiements.title")} — ${t("common.appName")}`,
    };
}

export default async function PaiementsAgriculteursPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const result = await getBonsAchatAvecSoldeAction();

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des bons d'achat");
    }

    return <PaiementsAgriculteursPageContent bonsAchat={result.data || []} />;
}
