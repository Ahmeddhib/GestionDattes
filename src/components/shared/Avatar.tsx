import { cn } from "@/lib/utils";
import Image from "next/image";

const AVATAR_COLORS = ["#C17A2B", "#7C9C3A", "#8B4A0F", "#5C7A8B", "#9B5A8B"];

interface AvatarProps {
    name: string;
    size?: "sm" | "md" | "lg";
    className?: string;
    image?: string | null;
}

export function Avatar({ name, size = "md", className, image }: AvatarProps) {
    const sizeClasses = {
        sm: "w-7 h-7 text-xs",
        md: "w-9 h-9 text-sm",
        lg: "w-12 h-12 text-base",
    };

    // Générer une couleur cohérente basée sur le nom
    const colorIndex = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
    const bgColor = AVATAR_COLORS[colorIndex];

    const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    if (image) {
        return (
            <span className={cn("relative block shrink-0 overflow-hidden rounded-lg ring-1 ring-white/20", sizeClasses[size], className)}>
                <Image src={image} alt={`Photo de ${name}`} fill sizes="48px" className="object-cover" referrerPolicy="no-referrer" />
            </span>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center rounded-lg font-bold text-white",
                sizeClasses[size],
                className
            )}
            style={{ backgroundColor: bgColor }}
        >
            {initials}
        </div>
    );
}
