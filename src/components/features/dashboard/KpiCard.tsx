"use client";

import Link from "next/link";
import {
    Banknote,
    HandCoins,
    PackageOpen,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
    Truck,
    UsersRound,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKg, formatMontant, formatNombre } from "@/lib/format";
import type { KpiDatum } from "@/types/dashboard";
import { useClientTranslations } from "@/hooks/useClientTranslations";

function formatValue(kpi: KpiDatum): string {
    if (kpi.unit === "TND") return formatMontant(kpi.value);
    if (kpi.unit === "kg") return formatKg(kpi.value);
    return formatNombre(kpi.value);
}

const CARD_STYLES: Record<string, { icon: LucideIcon; color: string; glow: string }> = {
    stockTotal: { icon: PackageOpen, color: "#e6a73c", glow: "rgba(230,167,60,.16)" },
    quantiteNetteLivree: { icon: Truck, color: "#68b65d", glow: "rgba(82,160,74,.15)" },
    chiffreAffaires: { icon: ShoppingCart, color: "#39a6b7", glow: "rgba(44,155,177,.15)" },
    tresorerieNette: { icon: Banknote, color: "#b56ad9", glow: "rgba(164,82,202,.16)" },
    dettesAgriculteurs: { icon: HandCoins, color: "#e05a42", glow: "rgba(203,66,47,.16)" },
    creancesClients: { icon: UsersRound, color: "#4d9bd5", glow: "rgba(50,131,190,.16)" },
};

export function KpiCard({ kpi }: { kpi: KpiDatum }) {
    const { t } = useClientTranslations();
    const style = CARD_STYLES[kpi.code] ?? CARD_STYLES.stockTotal;
    const Icon = style.icon;
    const EvolutionIcon = kpi.evolution?.isPositive ? TrendingUp : TrendingDown;

    return (
        <Link
            href={kpi.href}
            className="dashboard-card group relative min-h-31 overflow-hidden rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 outline-none transition duration-300 hover:-translate-y-0.5 hover:border-[#9b6b31]/60 focus-visible:ring-2 focus-visible:ring-[#e6a73c]"
            style={{ boxShadow: `inset 0 0 45px ${style.glow}, var(--dash-kpi-shadow)` }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card/75 dark:bg-black/20"
                    style={{ color: style.color, borderColor: `${style.color}55`, boxShadow: `0 0 22px ${style.glow}` }}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[#c9b9a3]">{t(`dashboard.kpi.${kpi.code}`)}</p>
                    <p className="mt-1 truncate text-lg font-semibold tracking-tight text-white xl:text-xl">
                        {formatValue(kpi)}
                    </p>
                    {kpi.evolution && (
                        <p
                            dir="ltr"
                            className={cn(
                                "mt-2 flex items-start gap-1 text-[11px] font-medium",
                                kpi.evolution.isPositive
                                    ? "text-emerald-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            )}
                        >
                            {!kpi.evolution.isNew && <EvolutionIcon className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />}
                            <span>{kpi.evolution.value}</span>
                            <span className="ms-1 font-normal text-[#8e806e]">
                                {kpi.comparisonKey ? t(`dashboard.premium.${kpi.comparisonKey}`) : kpi.comparisonLabel}
                            </span>
                        </p>
                    )}
                </div>
            </div>
            <div
                className="absolute inset-x-4 bottom-2 h-px opacity-40"
                style={{ background: `linear-gradient(90deg,transparent,${style.color},transparent)` }}
            />
        </Link>
    );
}

export function KpiCardGrid({ kpis }: { kpis: KpiDatum[] }) {
    if (kpis.length === 0) return null;
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((kpi) => <KpiCard key={kpi.code} kpi={kpi} />)}
        </div>
    );
}
