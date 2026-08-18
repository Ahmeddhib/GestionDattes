import { Users } from "lucide-react";

export default function AgricultureursLoading() {
    return (
        <div className="flex-1 space-y-6 p-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#C17A2B]/10 p-3">
                        <Users className="h-6 w-6 text-[#C17A2B] animate-pulse" />
                    </div>
                    <div>
                        <div className="h-9 w-64 animate-pulse rounded-lg bg-border" />
                        <div className="mt-1 h-4 w-80 animate-pulse rounded bg-border" />
                    </div>
                </div>
                <div className="h-10 w-48 animate-pulse rounded-md bg-border" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-border bg-card p-6">
                        <div className="h-4 w-32 animate-pulse rounded bg-border" />
                        <div className="mt-2 h-9 w-20 animate-pulse rounded bg-border" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="rounded-lg border border-border bg-card p-6">
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-border" />
                    ))}
                </div>
            </div>
        </div>
    );
}
