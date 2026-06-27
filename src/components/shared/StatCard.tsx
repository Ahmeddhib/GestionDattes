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
                    <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-[#2C1A00]">{value}</p>
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
                    <div className="w-12 h-12 rounded-[9px] bg-dattes-100 flex items-center justify-center text-dattes-600">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
}
