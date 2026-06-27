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
            secondary: "bg-white border border-[#E0D0B0] text-[#7A5C3A] hover:bg-[#FAF3E8]",
            outline: "bg-white border border-[#E0D0B0] text-[#7A5C3A] hover:bg-[#FAF3E8]",
            ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
            danger: "bg-[#FDE8E8] border border-[#F0C0C0] text-[#8B1A1A] hover:bg-[#FCD5D5]",
            success: "bg-[#EBF5DB] border border-[#C0D890] text-[#3D6010] hover:bg-[#DFF0C8]",
        };

        const sizeStyles = {
            sm: "px-3 py-1.5 text-xs rounded-sm",
            md: "px-4 py-2 text-[13px] rounded-md",
            lg: "px-6 py-3 text-sm rounded-md",
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
