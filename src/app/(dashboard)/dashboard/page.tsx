import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { hasPermission } from "@/lib/permissions";
import { saisonService } from "@/services/saison.service";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardFiltersValue, PeriodeDashboard } from "@/types/dashboard";
import { DashboardContent } from "./DashboardContent";

export const metadata = {
    title: "Tableau de bord — Gestion des Dattes",
};

const VALID_PERIODES: PeriodeDashboard[] = ["jour", "semaine", "mois", "annee", "saison", "personnalisee"];

interface DashboardPageProps {
    searchParams: Promise<{
        periode?: string;
        saisonId?: string;
        dateFrom?: string;
        dateTo?: string;
    }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);
    if (!session.user.tenantId) redirect("/select-wakala");

    const params = await searchParams;
    const tenantId = getTenantFromSession(session);

    const periode: PeriodeDashboard = VALID_PERIODES.includes(params.periode as PeriodeDashboard)
        ? (params.periode as PeriodeDashboard)
        : "mois";

    const filters: DashboardFiltersValue = {
        periode,
        saisonId: params.saisonId,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    };

    const [
        canLivraison,
        canVente,
        canPaiementAgriculteur,
        canEncaissementClient,
        canDepense,
        canStock,
        canFinance,
        canSaison,
    ] = await Promise.all([
        hasPermission("livraison:read"),
        hasPermission("vente:read"),
        hasPermission("paiement-agriculteur:read"),
        hasPermission("encaissement-client:read"),
        hasPermission("depense:read"),
        hasPermission("stock-date:read"),
        hasPermission("finance:read"),
        hasPermission("saison:read"),
    ]);

    const [saisons, saisonActive] = await Promise.all([
        canSaison ? saisonService.getAll(tenantId) : Promise.resolve([]),
        canSaison ? dashboardService.getActiveSaison(tenantId) : Promise.resolve(null),
    ]);

    return (
        <DashboardContent
            tenantId={tenantId}
            userName={session.user.name}
            wakalaName={session.user.tenantName || ""}
            filters={filters}
            saisons={saisons.map((s) => ({ id: s.id, nom: s.nom }))}
            saisonActive={saisonActive}
            permissions={{
                canLivraison,
                canVente,
                canPaiementAgriculteur,
                canEncaissementClient,
                canDepense,
                canStock,
                canFinance,
                canSaison,
            }}
        />
    );
}
