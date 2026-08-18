"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, type TooltipContentProps } from "recharts";
import { ChartCard } from "./ChartCard";
import { CHART_COLORS, CHART_NEUTRAL } from "./chart-colors";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface RepartitionDatum {
    typeDateId: string;
    nom: string;
    quantite: number;
}

const SLICE_COLORS = [CHART_COLORS.blue.light, CHART_COLORS.orange.light, CHART_COLORS.aqua.light, CHART_COLORS.yellow.light];

function buildSlices(data: RepartitionDatum[], autresLabel: string) {
    if (data.length <= 4) return data;
    const top = data.slice(0, 4);
    const autres = data.slice(4).reduce((sum, d) => sum + d.quantite, 0);
    return [...top, { typeDateId: "autres", nom: autresLabel, quantite: autres }];
}

function RepartitionTooltip({ active, payload }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as RepartitionDatum;
    return (
        <div className="rounded-md border border-border bg-white p-3 text-sm shadow-md dark:bg-[#2A1800] dark:border-dattes-800">
            <p className="font-medium text-text-primary dark:text-dattes-100">{d.nom}</p>
            <p>{formatKg(d.quantite)}</p>
        </div>
    );
}

export function LivraisonsRepartitionChart({ data }: { data: RepartitionDatum[] }) {
    const { t } = useClientTranslations();
    const slices = buildSlices(data, t("dashboard.charts.repartition.autres"));

    return (
        <ChartCard
            title={t("dashboard.charts.repartition.title")}
            description={t("dashboard.charts.repartition.description")}
            href={ROUTES.LIVRAISONS}
            hrefLabel={t("dashboard.viewModule")}
            isEmpty={data.length === 0}
            emptyMessage={t("dashboard.empty.chart")}
        >
            <ResponsiveContainer width="100%" height={260} initialDimension={{ width: 1, height: 1 }}>
                <PieChart>
                    <Pie
                        data={slices}
                        dataKey="quantite"
                        nameKey="nom"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                    >
                        {slices.map((s, i) => (
                            <Cell
                                key={s.typeDateId}
                                fill={s.typeDateId === "autres" ? CHART_NEUTRAL.light : SLICE_COLORS[i % SLICE_COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={(props) => <RepartitionTooltip {...props} />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}
