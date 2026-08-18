import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
    className?: string;
    padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
    const paddingClasses = {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <div
            className={cn(
                "erp-card rounded-2xl border border-[#e5d8c5] bg-white/92 text-[#2f2317] shadow-[0_12px_35px_rgba(83,52,20,.06)] backdrop-blur-sm dark:border-[#6b4b29]/45 dark:bg-[#14100c]/86 dark:text-[#f8f1e4] dark:shadow-[0_18px_45px_rgba(0,0,0,.20)]",
                paddingClasses[padding],
                className
            )}
        >
            {children}
        </div>
    );
}
