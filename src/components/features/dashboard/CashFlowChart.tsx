"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    type TooltipContentProps,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_INK } from "./chart-colors";
import { formatMontant } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { TrendPoint } from "@/types/dashboard";

function CashFlowTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-border bg-white p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-dattes-800">
            <p className="mb-1 font-medium text-text-primary dark:text-dattes-100">{label}</p>
            {payload.map((entry) => (
                <p key={String(entry.dataKey)} style={{ color: entry.color }}>
                    {entry.name}: {formatMontant(Number(entry.value))}
                </p>
            ))}
        </div>
    );
}

export function CashFlowChart({ data }: { data: TrendPoint[] }) {
    const { t } = useClientTranslations();
    return (
        <ChartCard
            title={t("dashboard.charts.cashflow.title")}
            description={t("dashboard.charts.cashflow.description")}
            href={ROUTES.FINANCE}
            hrefLabel={t("dashboard.viewModule")}
            isEmpty={data.length === 0}
            emptyMessage={t("dashboard.empty.chart")}
        >
            <ResponsiveContainer width="100%" height={260} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid.light} vertical={false} />
                    <XAxis
                        dataKey="periode"
                        tick={{ fontSize: 12, fill: CHART_INK.secondary.light }}
                        tickLine={false}
                        axisLine={{ stroke: CHART_INK.grid.light }}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: CHART_INK.secondary.light }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatMontant(v)}
                        width={90}
                    />
                    <Tooltip content={(props) => <CashFlowTooltip {...props} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="encaissements" name={t("dashboard.charts.cashflow.encaissements")} fill={CHART_COLORS.blue.light} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="paiements" name={t("dashboard.charts.cashflow.paiements")} fill={CHART_COLORS.orange.light} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="depenses" name={t("dashboard.charts.cashflow.depenses")} fill={CHART_COLORS.aqua.light} radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
