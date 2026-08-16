"use client";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    type TooltipContentProps,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_INK } from "./chart-colors";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { TrendPoint } from "@/types/dashboard";

function TrendTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-[#F0E0C0] bg-white p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <p className="mb-1 font-medium text-[#2C1A00] dark:text-[#F5E6C8]">{label}</p>
            {payload.map((entry) => (
                <p key={String(entry.dataKey)} style={{ color: entry.color }}>
                    {entry.name}: {formatKg(Number(entry.value))}
                </p>
            ))}
        </div>
    );
}

export function DeliveriesTrendChart({ data }: { data: TrendPoint[] }) {
    const { t } = useClientTranslations();
    return (
        <ChartCard
            title={t("dashboard.charts.deliveries.title")}
            description={t("dashboard.charts.deliveries.description")}
            href={ROUTES.LIVRAISONS}
            hrefLabel={t("dashboard.viewModule")}
            isEmpty={data.length === 0}
            emptyMessage={t("dashboard.empty.chart")}
        >
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                        tickFormatter={(v) => formatKg(v)}
                        width={70}
                    />
                    <Tooltip content={(props) => <TrendTooltip {...props} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                        type="monotone"
                        dataKey="poidsNet"
                        name={t("dashboard.charts.deliveries.poidsNet")}
                        stroke={CHART_COLORS.orange.light}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="quantitePayable"
                        name={t("dashboard.charts.deliveries.quantitePayable")}
                        stroke={CHART_COLORS.blue.light}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
