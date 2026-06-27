"use client";

import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/users": "Utilisateurs",
    "/dashboard/roles": "Rôles",
    "/dashboard/audit-logs": "Audit Logs",
};

export function SiteHeader({ session }: { session: Session }) {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] ?? "Dashboard";

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <div className="flex flex-1 items-center justify-between">
                    <h1 className="text-base font-semibold text-foreground">{title}</h1>
                    <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {session.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{session.user?.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-medium">
                                {session.user?.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
