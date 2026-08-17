import { BanknoteArrowDown, HandCoins, ReceiptText, WalletCards } from "lucide-react";
import { formatMontant } from "@/lib/format";
import type { BilanGlobal } from "@/services/finance.service";
import { getServerTranslations } from "@/i18n/server";

export async function FinancialSummary({ bilan, periodLabel }: { bilan: BilanGlobal; periodLabel?: string }) {
    const t = await getServerTranslations();
    const rows = [
        { label: t("dashboard.premium.collected"), value: bilan.totalEncaissementsClients, icon: BanknoteArrowDown, tone: "green" },
        { label: t("dashboard.premium.paidFarmers"), value: bilan.totalPaiementsAgriculteurs, icon: HandCoins, tone: "gold" },
        { label: t("dashboard.premium.expenses"), value: bilan.totalDepensesAutres, icon: ReceiptText, tone: "red" },
        { label: t("dashboard.premium.netCash"), value: bilan.tresorerieNette, icon: WalletCards, tone: "blue" },
    ] as const;
    const tones = {
        green: "border-green-200 bg-green-100/80 text-green-600 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-400",
        gold: "border-amber-200 bg-amber-100/80 text-amber-600 dark:border-amber-700/40 dark:bg-amber-900/30 dark:text-amber-400",
        red: "border-red-200 bg-red-100/80 text-red-600 dark:border-red-800/40 dark:bg-red-950/35 dark:text-red-400",
        blue: "border-sky-200 bg-sky-100/80 text-sky-600 dark:border-sky-800/40 dark:bg-sky-950/35 dark:text-sky-400",
    };

    return (
        <section className="dashboard-card h-full rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-white">{t("dashboard.premium.financialTitle")}</h2>
                <p className="max-w-36 truncate rounded-lg border border-[#dfcfb9] bg-[#fbf5ec] px-2 py-1 text-[10px] text-[#7e684e] dark:border-[#6b4b29]/35 dark:bg-black/10 dark:text-[#8e806e]">{periodLabel ?? bilan.periodeLabel}</p>
            </div>
            <div className="divide-y divide-[#5b4027]/35">
                {rows.map(({ label, value, icon: Icon, tone }) => (
                    <div key={label} className="flex items-center gap-3 py-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <span className="min-w-0 flex-1 text-xs text-[#c9b9a3]">{label}</span>
                        <strong className="shrink-0 whitespace-nowrap text-[11px] text-white sm:text-xs">{formatMontant(value)}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
