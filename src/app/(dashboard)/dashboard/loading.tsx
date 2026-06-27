import { StatsSkeleton } from "@/components/shared/LoadingSkeleton";

export default function DashboardLoading() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
            <StatsSkeleton />
        </div>
    );
}
