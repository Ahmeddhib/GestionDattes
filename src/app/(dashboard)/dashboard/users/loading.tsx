import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function UsersLoading() {
    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-sm animate-pulse mb-6" />
            <div className="bg-card border border-border rounded-lg p-6">
                <TableSkeleton rows={8} />
            </div>
        </div>
    );
}
