"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, type TooltipContentProps } from "recharts";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_INK } from "./chart-colors";
import { formatKg, formatMontant } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import type { TrendPoint } from "@/types/dashboard";

function QuantiteTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-border bg-card p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-dattes-800">
            <p className="font-medium text-text-primary dark:text-dattes-100">{label}</p>
            <p style={{ color: CHART_COLORS.blue.light }}>{formatKg(Number(payload[0].value))}</p>
        </div>
    );
}

function MontantTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-md border border-border bg-card p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-dattes-800">
            <p className="font-medium text-text-primary dark:text-dattes-100">{label}</p>
            <p style={{ color: CHART_COLORS.orange.light }}>{formatMontant(Number(payload[0].value))}</p>
        </div>
    );
}

/**
 * Deux mini-graphiques à axe unique plutôt qu'un graphique à double axe
 * (quantité en kg / montant en TND ne partagent pas d'échelle — un
 * double-axe serait trompeur, cf. règle "One axis" de la charte dataviz).
 */
export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
    const { t } = useClientTranslations();
    return (
        <ChartCard
            title={t("dashboard.charts.sales.title")}
            description={t("dashboard.charts.sales.description")}
            href={ROUTES.VENTES}
            hrefLabel={t("dashboard.viewModule")}
            isEmpty={data.length === 0}
            emptyMessage={t("dashboard.empty.chart")}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground dark:text-text-hint">
                        {t("dashboard.charts.sales.quantite")}
                    </p>
                    <ResponsiveContainer width="100%" height={200} initialDimension={{ width: 1, height: 1 }}>
                        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid.light} vertical={false} />
                            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: CHART_INK.secondary.light }} tickLine={false} axisLine={{ stroke: CHART_INK.grid.light }} />
                            <YAxis tick={{ fontSize: 11, fill: CHART_INK.secondary.light }} tickLine={false} axisLine={false} tickFormatter={(v) => formatKg(v)} width={60} />
                            <Tooltip content={(props) => <QuantiteTooltip {...props} />} />
                            <Line type="monotone" dataKey="quantite" name={t("dashboard.charts.sales.quantite")} stroke={CHART_COLORS.blue.light} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground dark:text-text-hint">
                        {t("dashboard.charts.sales.montant")}
                    </p>
                    <ResponsiveContainer width="100%" height={200} initialDimension={{ width: 1, height: 1 }}>
                        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_INK.grid.light} vertical={false} />
                            <XAxis dataKey="periode" tick={{ fontSize: 11, fill: CHART_INK.secondary.light }} tickLine={false} axisLine={{ stroke: CHART_INK.grid.light }} />
                            <YAxis tick={{ fontSize: 11, fill: CHART_INK.secondary.light }} tickLine={false} axisLine={false} tickFormatter={(v) => formatMontant(v)} width={80} />
                            <Tooltip content={(props) => <MontantTooltip {...props} />} />
                            <Line type="monotone" dataKey="montant" name={t("dashboard.charts.sales.montant")} stroke={CHART_COLORS.orange.light} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </ChartCard>
    );
}
