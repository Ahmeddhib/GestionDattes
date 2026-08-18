"use client";

import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    type TooltipContentProps,
} from "recharts";
import { Wheat } from "lucide-react";
import { formatKg, formatMontant } from "@/lib/format";
import type { TrendPoint } from "@/types/dashboard";
import { useClientTranslations } from "@/hooks/useClientTranslations";

const SERIES = [
    { key: "poidsNet", labelKey: "dashboard.premium.deliveries", color: "#e6a73c", unit: "kg" },
    { key: "montant", labelKey: "dashboard.premium.sales", color: "#5ea95c", unit: "TND" },
    { key: "encaissements", labelKey: "dashboard.premium.collections", color: "#3d9ac4", unit: "TND" },
    { key: "paiements", labelKey: "dashboard.premium.farmerPayments", color: "#e26036", unit: "TND" },
] as const;

type TranslatedSeries = (typeof SERIES)[number] & { label: string };

function formatAxisValue(value: number): string {
    return new Intl.NumberFormat("fr-FR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function ActivityTooltip({ active, payload, label, series }: TooltipContentProps & { series: TranslatedSeries[] }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="min-w-56 rounded-xl border border-[#dfcfb9] bg-[#fffdf9]/95 p-3 text-xs shadow-2xl backdrop-blur-xl dark:border-[#6b4b29]/60 dark:bg-[#17120d]/95">
            <p className="mb-2 font-semibold text-white">{label}</p>
            <div className="space-y-1.5">
                {payload.map((item) => {
                    const serie = series.find((entry) => entry.key === item.dataKey);
                    if (!serie) return null;
                    const value = Number(item.value ?? 0);
                    return (
                        <div key={serie.key} className="flex items-center justify-between gap-5">
                            <span className="flex items-center gap-2 text-[#705f4c] dark:text-[#c9b9a3]">
                                <span className="h-2 w-2 rounded-full" style={{ background: serie.color }} />
                                {serie.label}
                            </span>
                            <strong className="text-white">{serie.unit === "kg" ? formatKg(value) : formatMontant(value)}</strong>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ActivityTrendChart({ data }: { data: TrendPoint[] }) {
    const { t } = useClientTranslations();
    const series: TranslatedSeries[] = SERIES.map((item) => ({ ...item, label: t(item.labelKey) }));
    return (
        <section className="dashboard-card h-full min-h-105 rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/82 p-4 shadow-[0_20px_60px_rgba(0,0,0,.24)] backdrop-blur-md sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 shadow-sm dark:border-[#b97824]/45 dark:bg-[#5a310b]/35 dark:text-[#f0b548] dark:shadow-none">
                        <Wheat className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{t("dashboard.premium.activityTitle")}</h2>
                        <p className="text-xs text-[#a89985]">{t("dashboard.premium.activityDescription")}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#c9b9a3]">
                    {series.map((serie) => (
                        <span key={serie.key} className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: serie.color }} />
                            {serie.label}
                        </span>
                    ))}
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-80 items-center justify-center text-sm text-[#8e806e]">{t("dashboard.empty.chart")}</div>
            ) : (
                <ResponsiveContainer width="100%" height={330} initialDimension={{ width: 1, height: 1 }}>
                    <ComposedChart data={data} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="deliveryGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e6a73c" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#e6a73c" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#5c452d" strokeOpacity={0.22} vertical={false} />
                        <XAxis dataKey="periode" tick={{ fill: "#8e806e", fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tickFormatter={formatAxisValue} tick={{ fill: "#8e806e", fontSize: 11 }} tickLine={false} axisLine={false} width={54} />
                        <Tooltip content={(props) => <ActivityTooltip {...props} series={series} />} cursor={{ stroke: "#b97824", strokeOpacity: 0.35 }} />
                        <Area type="monotone" dataKey="poidsNet" stroke="#e6a73c" fill="url(#deliveryGlow)" strokeWidth={2.2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="montant" stroke="#5ea95c" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="encaissements" stroke="#3d9ac4" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="paiements" stroke="#e26036" strokeWidth={2} dot={false} connectNulls />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </section>
    );
}
