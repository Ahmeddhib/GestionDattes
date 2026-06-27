import { TableSkeleton } from "@/components/shared/LoadingSkeleton";

export default function RolesLoading() {
    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded-[9px] animate-pulse" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-[7px] animate-pulse mb-6" />
            <div className="bg-white border border-[#F0E0C0] rounded-[14px] p-6">
                <TableSkeleton rows={5} />
            </div>
        </div>
    );
}
