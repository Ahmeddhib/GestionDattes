import { auth } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getLivraisonsPageAction } from "@/actions/livraisons/get-livraisons-page.action";
import { parseQueryParams, type RawSearchParams } from "@/lib/pagination";
import { LivraisonsPageContent } from "./LivraisonsPageContent";

export const metadata = {
    title: "Livraisons - Gestion Dattes",
    description: "Gestion des livraisons de dattes",
};

export default async function LivraisonsPage({
    searchParams,
}: {
    searchParams: Promise<RawSearchParams>;
}) {
    const session = await auth();
    const params = await searchParams;

    const tenantId = await getTenantId();
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        typeof params.saisonId === "string" ? params.saisonId : undefined
    );

    // Pagination, tri et recherche sont lus et bornés ici, puis transmis tels
    // quels : rien de l'URL n'atteint Prisma sans passer par cette étape.
    const query = parseQueryParams(params, { sortBy: "dateLivraison", sortDir: "desc" });

    const result = await getLivraisonsPageAction({ ...query, saisonId });

    if (!result.success) {
        return (
            <div className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
                <div className="rounded-[14px] border border-red-200 bg-red-50 p-4 text-red-800">
                    Erreur: {result.error}
                </div>
            </div>
        );
    }

    return (
        <LivraisonsPageContent
            resultat={result.data.resultat}
            totaux={result.data.totaux}
            canEditAcceptedQuantity={
                session?.user.role === ROLES.ADMIN || session?.user.role === ROLES.DIRECTION
            }
            saisonFiltre={saisonFiltre}
            saisonOuverte={saisonOuverte}
        />
    );
}
