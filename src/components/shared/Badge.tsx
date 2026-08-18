import { cn } from "@/lib/utils";

type BadgeVariant =
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "role"
    | "active"
    | "inactive"
    | "create"
    | "update"
    | "activate"
    | "deactivate"
    | "change";

interface BadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    className?: string;
    dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-[#d8c9b6]",
    secondary: "border border-[#E8C97A] bg-[#F5E6C8] text-[#8B4A0F] dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300",
    success: "bg-[#EBF2DC] text-[#3D6010] dark:bg-green-950/45 dark:text-green-300",
    warning: "bg-[#FDF0D5] text-[#8B4A0F] dark:bg-amber-950/45 dark:text-amber-300",
    danger: "bg-[#FDE8E8] text-[#8B1A1A] dark:bg-red-950/45 dark:text-red-300",
    role: "border border-[#E8C97A] bg-[#F5E6C8] text-[#8B4A0F] dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-300",
    active: "bg-[#EBF2DC] text-[#3D6010] dark:bg-green-950/45 dark:text-green-300",
    inactive: "bg-[#FDE8E8] text-[#8B1A1A] dark:bg-red-950/45 dark:text-red-300",
    create: "bg-[#FDF0D5] text-[#8B4A0F] dark:bg-amber-950/45 dark:text-amber-300",
    update: "bg-[#E0EEF8] text-[#1A4A7C] dark:bg-sky-950/45 dark:text-sky-300",
    activate: "bg-[#EBF2DC] text-[#3D6010] dark:bg-green-950/45 dark:text-green-300",
    deactivate: "bg-[#FEF0E0] text-[#8B5A00] dark:bg-orange-950/45 dark:text-orange-300",
    change: "bg-[#EEE8FD] text-[#4A1A8C] dark:bg-purple-950/45 dark:text-purple-300",
};

const dotColors: Record<BadgeVariant, string> = {
    default: "#6B7280",
    secondary: "#E8C97A",
    success: "#5A9A20",
    warning: "#E8A84A",
    danger: "#C03030",
    role: "#E8C97A",
    active: "#5A9A20",
    inactive: "#C03030",
    create: "#E8A84A",
    update: "#1A4A7C",
    activate: "#5A9A20",
    deactivate: "#8B5A00",
    change: "#4A1A8C",
};

export function Badge({ variant, children, className, dot = false }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold",
                variantStyles[variant],
                className
            )}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: dotColors[variant] }}
                />
            )}
            {children}
        </span>
    );
}
