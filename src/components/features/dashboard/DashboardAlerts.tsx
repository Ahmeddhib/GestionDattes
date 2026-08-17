import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServerTranslations } from "@/i18n/server";
import type { AlertItem } from "@/types/dashboard";

const STYLES = {
    danger: { icon: ShieldAlert, box: "border-red-200 bg-red-50/70 dark:border-red-800/35 dark:bg-red-950/28", iconStyle: "bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400" },
    warning: { icon: AlertTriangle, box: "border-amber-200 bg-amber-50/75 dark:border-amber-800/30 dark:bg-amber-950/20", iconStyle: "bg-amber-100 text-amber-600 dark:bg-amber-950/75 dark:text-amber-400" },
    info: { icon: Info, box: "border-sky-200 bg-sky-50/75 dark:border-sky-800/30 dark:bg-sky-950/20", iconStyle: "bg-sky-100 text-sky-600 dark:bg-sky-950/75 dark:text-sky-400" },
};

export async function DashboardAlerts({ alerts }: { alerts: AlertItem[] }) {
    const t = await getServerTranslations();
    return (
        <section className="dashboard-card rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-white">{t("dashboard.alerts.title")}</h2>
                <span className="rounded-full border border-[#dfcfb9] bg-[#f8efe2] px-2 py-0.5 text-[10px] text-[#7e684e] dark:border-[#5e452d]/50 dark:bg-black/20 dark:text-[#a89985]">{alerts.length}</span>
            </div>
            {alerts.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 dark:border-green-800/30 dark:bg-green-950/25 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4" />{t("dashboard.alerts.allClear")}
                </div>
            ) : (
                <ul className="space-y-2">
                    {alerts.slice(0, 5).map((alert) => {
                        const style = STYLES[alert.severity];
                        const Icon = style.icon;
                        const content = (
                            <div className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:brightness-125", style.box)}>
                                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", style.iconStyle)}><Icon className="h-4 w-4" /></span>
                                <span className="min-w-0 flex-1 text-xs leading-5 text-[#5f4d3a] dark:text-[#d6c8b6]">{alert.message}</span>
                                {alert.href && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#7f705e] rtl:rotate-180" />}
                            </div>
                        );
                        return <li key={alert.code}>{alert.href ? <Link href={alert.href}>{content}</Link> : content}</li>;
                    })}
                </ul>
            )}
        </section>
    );
}
