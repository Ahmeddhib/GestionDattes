import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200 rounded-[9px]",
                className
            )}
        />
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <LoadingSkeleton className="h-12 w-12 rounded-[8px]" />
                    <div className="flex-1 space-y-2">
                        <LoadingSkeleton className="h-4 w-1/3" />
                        <LoadingSkeleton className="h-3 w-1/2" />
                    </div>
                    <LoadingSkeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#F0E0C0] rounded-[14px] p-6">
                    <LoadingSkeleton className="h-4 w-1/2 mb-2" />
                    <LoadingSkeleton className="h-8 w-2/3" />
                </div>
            ))}
        </div>
    );
}
