import { Skeleton } from "@/components/ui/skeleton";

const cardClass = "dashboard-card rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-5 backdrop-blur-md";
const skeletonClass = "bg-[#5c4027]/45";

export function KpiGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cardClass}>
                    <Skeleton className={`mb-3 h-9 w-9 rounded-xl ${skeletonClass}`} />
                    <Skeleton className={`mb-2 h-3 w-24 ${skeletonClass}`} />
                    <Skeleton className={`h-7 w-28 ${skeletonClass}`} />
                </div>
            ))}
        </div>
    );
}

export function ChartCardSkeleton() {
    return (
        <div className={cardClass}>
            <Skeleton className={`mb-2 h-5 w-40 ${skeletonClass}`} />
            <Skeleton className={`mb-4 h-4 w-56 ${skeletonClass}`} />
            <Skeleton className={`h-64 w-full ${skeletonClass}`} />
        </div>
    );
}

export function TableCardSkeleton() {
    return (
        <div className={cardClass}>
            <Skeleton className={`mb-4 h-5 w-40 ${skeletonClass}`} />
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className={`h-8 w-full ${skeletonClass}`} />
                ))}
            </div>
        </div>
    );
}

export function AlertsSkeleton() {
    return (
        <div className={cardClass}>
            <Skeleton className={`mb-4 h-5 w-32 ${skeletonClass}`} />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className={`h-10 w-full ${skeletonClass}`} />
                ))}
            </div>
        </div>
    );
}
