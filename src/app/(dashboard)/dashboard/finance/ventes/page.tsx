import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getVentesPageAction } from "@/actions/ventes/get-ventes-page.action";
import { parseQueryParams, parseBorneDate, type RawSearchParams } from "@/lib/pagination";
import { VentesPageContent } from "./VentesPageContent";
import { getTenantPdfBranding } from "@/lib/pdf-branding.server";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.ventes.title")} — ${t("common.appName")}`,
    };
}

/** Seuls les statuts connus passent le filtre — l'URL n'impose rien à Prisma. */
function parseStatut(
    brut: string | string[] | undefined
): "EN_ATTENTE" | "PARTIEL" | "PAYE" | undefined {
    const valeur = Array.isArray(brut) ? brut[0] : brut;
    return valeur === "EN_ATTENTE" || valeur === "PARTIEL" || valeur === "PAYE" ? valeur : undefined;
}

export default async function VentesPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const tenantId = await getTenantId();
    const params = await searchParams;
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        typeof params.saisonId === "string" ? params.saisonId : undefined
    );

    const query = parseQueryParams(params, { sortBy: "createdAt", sortDir: "desc" });

    // Filtres du module, désormais appliqués en base : les appliquer dans le
    // tableau ne filtrerait plus qu'une page.
    const filtres = {
        clientId:
            typeof params.clientId === "string" && params.clientId !== "tous"
                ? params.clientId
                : undefined,
        statut: parseStatut(params.statut),
        from: parseBorneDate(params.from, "debut"),
        to: parseBorneDate(params.to, "fin"),
    };

    const [result, pdfBranding] = await Promise.all([
        getVentesPageAction({ ...query, saisonId, filtres }),
        getTenantPdfBranding(tenantId),
    ]);

    if (!result.success) {
        throw new Error(result.error || "Erreur lors du chargement des ventes");
    }

    return (
        <VentesPageContent
            resultat={result.data.resultat}
            totaux={result.data.totaux}
            clients={result.data.clients}
            saisonFiltre={saisonFiltre}
            saisonOuverte={saisonOuverte}
            branding={pdfBranding}
        />
    );
}
