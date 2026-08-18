import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
    return (
        <Card className={cn("relative overflow-hidden", className)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="mb-1 text-sm font-medium text-[#806d57] dark:text-[#aa9983]">{title}</p>
                    <p className="text-3xl font-bold text-text-primary dark:text-white">{value}</p>
                    {trend && (
                        <p
                            className={cn(
                                "text-sm mt-2 font-medium",
                                trend.isPositive ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {trend.isPositive ? "↑" : "↓"} {trend.value}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dattes-100 text-dattes-600 dark:bg-[#4b2b0e]/60 dark:text-[#efb453]">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
}
