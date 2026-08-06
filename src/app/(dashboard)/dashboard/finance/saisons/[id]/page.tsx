import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getSaisonDetailAction } from "@/actions/saisons/get-saison-detail.action";
import { SaisonDetailContent } from "./SaisonDetailContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.saisons.bilan.title")} — ${t("common.appName")}`,
    };
}

export default async function SaisonDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const { id } = await params;
    const result = await getSaisonDetailAction(id);

    if (!result.success || !result.data) {
        throw new Error(result.error || "Erreur lors du chargement de la saison");
    }

    const bilan = result.data.bilan
        ? {
              ...result.data.bilan,
              stockFinalParTypeDate: result.data.bilan.stockFinalParTypeDate as unknown as {
                  typeDateId: string;
                  nom: string;
                  quantiteDisponible: number;
              }[],
              stockCaisses: result.data.bilan.stockCaisses as unknown as {
                  typeCaisseId: string;
                  nom: string;
                  nombrePrete: number;
                  nombreRetourne: number;
                  nombreNonRetourne: number;
              }[],
          }
        : null;

    return <SaisonDetailContent saison={result.data.saison} bilan={bilan} />;
}
