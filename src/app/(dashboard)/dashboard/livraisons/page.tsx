import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { ROLES } from "@/constants/roles";
import { getTenantId } from "@/lib/tenant/get-tenant";
import { getSaisonFiltrePourPage } from "@/lib/saison-filter";
import { getLivraisonsAction } from "@/actions/livraisons/get-livraisons.action";
import { LivraisonsPageContent } from "./LivraisonsPageContent";

export const metadata = {
    title: "Livraisons - Gestion Dattes",
    description: "Gestion des livraisons de dattes",
};

export default async function LivraisonsPage({
    searchParams,
}: {
    searchParams: Promise<{ saisonId?: string }>;
}) {
    const session = await auth();
    const { saisonId: saisonParam } = await searchParams;

    const tenantId = await getTenantId();
    const { saisonId, saisonOuverte, saisonFiltre } = await getSaisonFiltrePourPage(
        tenantId,
        saisonParam
    );

    const result = await getLivraisonsAction({ saisonId });

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
        <Suspense fallback={<div className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">Chargement...</div>}>
            <LivraisonsPageContent
                livraisons={result.data || []}
                canEditAcceptedQuantity={
                    session?.user.role === ROLES.ADMIN || session?.user.role === ROLES.DIRECTION
                }
                saisonFiltre={saisonFiltre}
                saisonOuverte={saisonOuverte}
            />
        </Suspense>
    );
}
