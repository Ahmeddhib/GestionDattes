import { Card } from "@/components/shared/Card";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
                    <Skeleton className="mb-2 h-4 w-24" />
                    <Skeleton className="h-7 w-32" />
                </Card>
            ))}
        </div>
    );
}

export function ChartCardSkeleton() {
    return (
        <Card className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="mb-4 h-4 w-56" />
            <Skeleton className="h-64 w-full" />
        </Card>
    );
}

export function TableCardSkeleton() {
    return (
        <Card className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
        </Card>
    );
}

export function AlertsSkeleton() {
    return (
        <Card className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        </Card>
    );
}
