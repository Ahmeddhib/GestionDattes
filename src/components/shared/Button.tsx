import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", className, children, disabled, ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variantStyles = {
            primary: "bg-dattes-400 hover:bg-dattes-600 text-white focus:ring-dattes-400",
            secondary: "border border-border bg-card text-foreground hover:bg-muted",
            outline: "border border-border bg-background/75 text-foreground hover:bg-muted",
            ghost: "bg-transparent text-foreground hover:bg-muted",
            danger: "bg-[#FDE8E8] border border-[#F0C0C0] text-[#8B1A1A] hover:bg-[#FCD5D5]",
            success: "bg-[#EBF5DB] border border-[#C0D890] text-[#3D6010] hover:bg-[#DFF0C8]",
        };

        const sizeStyles = {
            sm: "min-h-9 rounded-lg px-3 py-1.5 text-xs",
            md: "min-h-10 rounded-xl px-4 py-2 text-[13px]",
            lg: "min-h-11 rounded-xl px-6 py-3 text-sm",
        };

        return (
            <button
                ref={ref}
                disabled={disabled}
                className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
