import { ReactNode } from "react";
import { FileX } from "lucide-react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({
    icon = <FileX className="w-12 h-12" />,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e5d0] text-[#b17a39] dark:bg-[#3b2816] dark:text-[#e4a64b]">
                {icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mb-6 max-w-md text-muted-foreground">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
