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
    default: "bg-gray-100 text-gray-700",
    secondary: "bg-[#F5E6C8] text-[#8B4A0F] border border-[#E8C97A]",
    success: "bg-[#EBF2DC] text-[#3D6010]",
    warning: "bg-[#FDF0D5] text-[#8B4A0F]",
    danger: "bg-[#FDE8E8] text-[#8B1A1A]",
    role: "bg-[#F5E6C8] text-[#8B4A0F] border border-[#E8C97A]",
    active: "bg-[#EBF2DC] text-[#3D6010]",
    inactive: "bg-[#FDE8E8] text-[#8B1A1A]",
    create: "bg-[#FDF0D5] text-[#8B4A0F]",
    update: "bg-[#E0EEF8] text-[#1A4A7C]",
    activate: "bg-[#EBF2DC] text-[#3D6010]",
    deactivate: "bg-[#FEF0E0] text-[#8B5A00]",
    change: "bg-[#EEE8FD] text-[#4A1A8C]",
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
