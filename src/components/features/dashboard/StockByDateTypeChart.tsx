"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, type TooltipContentProps } from "recharts";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_INK, STATUS_COLORS } from "./chart-colors";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { StockParTypeDatum } from "@/types/dashboard";

type StockTooltipProps = TooltipContentProps & { t: (key: string) => string };

function StockTooltip({ active, payload, t }: StockTooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as StockParTypeDatum;
    const faible = d.seuilAlerte != null && d.quantiteDisponible < d.seuilAlerte;
    return (
        <div className="rounded-md border border-[#F0E0C0] bg-white p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <p className="mb-1 font-medium text-[#2C1A00] dark:text-[#F5E6C8]">{d.nom}</p>
            <p>
                {formatKg(d.quantiteDisponible)} {t("dashboard.charts.stock.disponible").toLowerCase()}
            </p>
            {d.seuilAlerte != null && (
                <p className={faible ? "text-red-600" : "text-gray-500"}>
                    {t("dashboard.charts.stock.seuil")} : {formatKg(d.seuilAlerte)}
                </p>
            )}
        </div>
    );
}

export function StockByDateTypeChart({ data }: { data: StockParTypeDatum[] }) {
    const { t } = useClientTranslations();
    return (
        <ChartCard
            title={t("dashboard.charts.stock.title")}
            description={t("dashboard.charts.stock.description")}
            href={ROUTES.STOCK_DATTES}
            hrefLabel={t("dashboard.viewModule")}
            isEmpty={data.length === 0}
            emptyMessage={t("dashboard.empty.chart")}
        >
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid.light} vertical={false} />
                    <XAxis
                        dataKey="nom"
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
                    <Tooltip content={(props) => <StockTooltip {...props} t={t} />} />
                    <Bar dataKey="quantiteDisponible" name={t("dashboard.charts.stock.disponible")} radius={[3, 3, 0, 0]}>
                        {data.map((d) => (
                            <Cell
                                key={d.typeDateId}
                                fill={
                                    d.seuilAlerte != null && d.quantiteDisponible < d.seuilAlerte
                                        ? STATUS_COLORS.critical.light
                                        : CHART_COLORS.orange.light
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
