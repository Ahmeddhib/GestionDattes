import {
    AlertsSkeleton,
    ChartCardSkeleton,
    KpiGridSkeleton,
    TableCardSkeleton,
} from "@/components/features/dashboard/DashboardSkeletons";

export default function DashboardLoading() {
    return (
        <div className="dashboard-premium relative min-h-full w-full min-w-0 overflow-hidden text-[#f8f1e4]">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[url('/dashboard-date-palm-bg.png')] bg-[length:1600px_auto] bg-top bg-no-repeat opacity-15 dark:opacity-35"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_48%_-10%,rgba(193,122,43,0.12),transparent_35%),linear-gradient(180deg,rgba(246,241,232,0.72),#f6f1e8_42%)] dark:bg-[radial-gradient(circle_at_48%_-10%,rgba(132,77,24,0.20),transparent_35%),linear-gradient(180deg,rgba(8,7,5,0.68),#0b0907_42%)]"
            />

            <div className="relative mx-auto w-full max-w-450 space-y-4 px-3 py-4 sm:px-5 lg:px-6 2xl:px-8">
                <div className="flex min-h-20 flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <div className="mb-3 h-7 w-56 animate-pulse rounded-lg bg-[#5c4027]/45" />
                        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-[#5c4027]/35" />
                    </div>
                    <div className="h-11 w-full animate-pulse rounded-xl border border-[#6b4b29]/45 bg-[#14100c]/86 lg:w-96" />
                </div>

                <KpiGridSkeleton />

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-8"><ChartCardSkeleton /></div>
                    <div className="space-y-4 xl:col-span-4">
                        <ChartCardSkeleton />
                        <AlertsSkeleton />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => <TableCardSkeleton key={index} />)}
                </div>
            </div>
        </div>
    );
}
