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
            <div className="w-16 h-16 rounded-[14px] bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-[#2C1A00] mb-2">{title}</h3>
            {description && (
                <p className="text-gray-600 mb-6 max-w-md">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
