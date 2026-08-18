import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart3 } from "lucide-react";

interface ChartCardProps {
    title: string;
    description?: string;
    href?: string;
    hrefLabel?: string;
    isEmpty: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
}

export function ChartCard({
    title,
    description,
    href,
    hrefLabel = "Voir le module",
    isEmpty,
    emptyMessage = "Aucune donnée pour cette période",
    children,
}: ChartCardProps) {
    return (
        <Card className="flex h-full min-w-0 flex-col dark:border-dattes-800 dark:bg-[#2A1800]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-text-primary dark:text-dattes-100">{title}</h3>
                    {description && (
                        <p className="text-sm text-gray-500 dark:text-text-hint">{description}</p>
                    )}
                </div>
                {href && (
                    <Link
                        href={href}
                        className="shrink-0 text-sm font-medium text-[#C17A2B] hover:underline"
                    >
                        {hrefLabel}
                    </Link>
                )}
            </div>
            {isEmpty ? (
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState icon={<BarChart3 className="h-10 w-10" />} title={emptyMessage} />
                </div>
            ) : (
                <div className="min-w-0 flex-1">{children}</div>
            )}
        </Card>
    );
}
