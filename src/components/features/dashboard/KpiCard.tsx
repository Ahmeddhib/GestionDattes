import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/shared/Card";
import { formatKg, formatMontant, formatNombre } from "@/lib/format";
import type { KpiDatum } from "@/types/dashboard";

function formatValue(kpi: KpiDatum): string {
    if (kpi.unit === "TND") return formatMontant(kpi.value);
    if (kpi.unit === "kg") return formatKg(kpi.value);
    return formatNombre(kpi.value);
}

export function KpiCard({ kpi }: { kpi: KpiDatum }) {
    return (
        <Link href={kpi.href} className="block h-full">
            <Card className="relative flex h-full flex-col justify-between overflow-hidden transition-shadow hover:shadow-md dark:bg-[#2A1800] dark:border-[#5C2D00]">
                <div>
                    <p className="mb-1 text-sm font-medium text-gray-600 dark:text-[#B08A5E]">{kpi.label}</p>
                    <p className="text-2xl font-bold text-[#2C1A00] dark:text-[#F5E6C8]">{formatValue(kpi)}</p>
                </div>
                {kpi.evolution && (
                    <p
                        dir="ltr"
                        className={cn(
                            "mt-2 text-sm font-medium",
                            kpi.evolution.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}
                    >
                        {kpi.evolution.isNew ? "" : kpi.evolution.isPositive ? "↑ " : "↓ "}
                        {kpi.evolution.value}
                    </p>
                )}
            </Card>
        </Link>
    );
}

export function KpiCardGrid({ kpis }: { kpis: KpiDatum[] }) {
    if (kpis.length === 0) return null;
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
                <KpiCard key={kpi.code} kpi={kpi} />
            ))}
        </div>
    );
}
