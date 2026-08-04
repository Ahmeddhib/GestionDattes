import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { getTenantFromSession } from "@/lib/tenant/get-tenant";
import { financeService, type BilanFilters, type PeriodeBilan } from "@/services/finance.service";
import { bonAchatService } from "@/services/bon-achat.service";
import { saisonService } from "@/services/saison.service";
import { BilanPageContent } from "./BilanPageContent";

export async function generateMetadata() {
    const t = await getServerTranslations();
    return {
        title: `${t("finance.bilan.title")} — ${t("common.appName")}`,
    };
}

const VALID_PERIODES: PeriodeBilan[] = ["jour", "mois", "annee", "saison", "personnalisee"];

interface FinancePageProps {
    searchParams: Promise<{
        periode?: string;
        saisonId?: string;
        dateFrom?: string;
        dateTo?: string;
    }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const params = await searchParams;
    const tenantId = getTenantFromSession(session);

    const periode: PeriodeBilan = VALID_PERIODES.includes(params.periode as PeriodeBilan)
        ? (params.periode as PeriodeBilan)
        : "mois";

    const filters: BilanFilters = {
        periode,
        saisonId: params.saisonId,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    };

    const [bilan, tenant, saisons] = await Promise.all([
        financeService.getBilanGlobal(tenantId, filters),
        bonAchatService.getTenantInfo(tenantId),
        saisonService.getAll(tenantId),
    ]);

    return (
        <BilanPageContent
            bilan={bilan}
            tenant={tenant}
            saisons={saisons}
            currentPeriode={periode}
            currentSaisonId={params.saisonId}
        />
    );
}
