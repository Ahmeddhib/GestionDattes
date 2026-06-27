import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AuditLogsLoading() {
    return (
        <div className="p-8">
            <div className="mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="bg-white border border-[#F0E0C0] rounded-[14px] p-6">
                <TableSkeleton rows={10} />
            </div>
        </div>
    );
}
