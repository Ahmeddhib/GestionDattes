import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { cn } from "@/lib/utils";
import { getServerTranslations } from "@/i18n/server";
import { AlertTriangle, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { AlertItem } from "@/types/dashboard";

const SEVERITY_STYLES: Record<AlertItem["severity"], { icon: typeof AlertTriangle; className: string }> = {
    danger: { icon: ShieldAlert, className: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" },
    warning: { icon: AlertTriangle, className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300" },
    info: { icon: Info, className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300" },
};

export async function DashboardAlerts({ alerts }: { alerts: AlertItem[] }) {
    const t = await getServerTranslations();
    return (
        <Card className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <h3 className="mb-4 text-base font-semibold text-[#2C1A00] dark:text-[#F5E6C8]">
                {t("dashboard.alerts.title")}
            </h3>

            {alerts.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {t("dashboard.alerts.allClear")}
                </div>
            ) : (
                <ul className="space-y-2">
                    {alerts.map((alert) => {
                        const { icon: Icon, className } = SEVERITY_STYLES[alert.severity];
                        const content = (
                            <div className={cn("flex items-start gap-2 rounded-md border p-3 text-sm", className)}>
                                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{alert.message}</span>
                            </div>
                        );
                        return (
                            <li key={alert.code}>
                                {alert.href ? (
                                    <Link href={alert.href} className="block transition-opacity hover:opacity-80">
                                        {content}
                                    </Link>
                                ) : (
                                    content
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}
