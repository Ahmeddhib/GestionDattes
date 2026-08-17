"use client";

import Link from "next/link";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ArrowRight } from "lucide-react";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type { StockParTypeDatum } from "@/types/dashboard";
import { useClientTranslations } from "@/hooks/useClientTranslations";

const COLORS = ["#e6a73c", "#5b9e51", "#3689b6", "#d75b38", "#9b67c4", "#9c7951"];

export function StockByDateTypeChart({ data }: { data: StockParTypeDatum[] }) {
    const { t } = useClientTranslations();
    const available = data.filter((item) => item.quantiteDisponible > 0);
    const total = available.reduce((sum, item) => sum + item.quantiteDisponible, 0);
    return (
        <section className="dashboard-card relative overflow-hidden rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <div aria-hidden className="pointer-events-none absolute -bottom-14 -right-16 h-52 w-52 rounded-full bg-[#9b5e1d]/10 blur-3xl" />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-3 -left-5 h-24 w-28 bg-[url('/dashboard-date-palm-bg.png')] bg-[length:580px_auto] bg-left-bottom bg-no-repeat opacity-30 dark:opacity-20"
                style={{
                    WebkitMaskImage: "radial-gradient(ellipse at 42% 62%, black 20%, rgba(0,0,0,.8) 42%, transparent 76%)",
                    maskImage: "radial-gradient(ellipse at 42% 62%, black 20%, rgba(0,0,0,.8) 42%, transparent 76%)",
                }}
            />
            <div className="relative mb-2 flex items-center justify-between gap-3">
                <h2 className="font-semibold text-white">{t("dashboard.charts.stock.title")}</h2>
                <Link href={ROUTES.STOCK_DATTES} className="inline-flex items-center gap-1 text-[11px] text-[#c9b9a3] hover:text-[#f0b548]">
                    {t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </Link>
            </div>
            {available.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-[#8e806e]">{t("dashboard.premium.stockEmpty")}</div>
            ) : (
                <div className="relative grid items-center gap-2 sm:grid-cols-[145px_1fr] xl:grid-cols-[145px_1fr]">
                    <div className="relative h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={available} dataKey="quantiteDisponible" nameKey="nom" innerRadius={43} outerRadius={64} paddingAngle={1} stroke="none">
                                    {available.map((item, index) => <Cell key={item.typeDateId} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-11 text-center">
                            <strong className="max-w-20 text-[15px] leading-none text-white tabular-nums">
                                {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(total)}
                            </strong>
                            <span className="mt-1 text-[10px] font-medium text-[#8e806e]">kg</span>
                            <span className="text-[9px] text-[#8e806e]">{t("dashboard.premium.total")}</span>
                        </div>
                    </div>
                    <div className="divide-y divide-[#5b4027]/30">
                        {available.slice(0, 5).map((item, index) => (
                            <div key={item.typeDateId} className="flex items-center gap-2 py-2 text-xs">
                                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                                <span className="min-w-0 flex-1 truncate text-[#d4c6b4]">{item.nom}</span>
                                <span className="font-medium text-white">{formatKg(item.quantiteDisponible)}</span>
                                <span className="w-9 text-right text-[#8e806e]">{Math.round((item.quantiteDisponible / total) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
