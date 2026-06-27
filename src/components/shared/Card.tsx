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
                "bg-white border border-[#F0E0C0] rounded-[14px] shadow-sm",
                paddingClasses[padding],
                className
            )}
        >
            {children}
        </div>
    );
}
