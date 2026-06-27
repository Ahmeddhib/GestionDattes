"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const routeNames: Record<string, string> = {
    "/dashboard": "Tableau de bord",
    "/dashboard/users": "Utilisateurs",
    "/dashboard/roles": "Rôles",
    "/dashboard/audit-logs": "Journal d'audit",
};

export function TopBar() {
    const pathname = usePathname();
    const pageName = routeNames[pathname] || "Dashboard";

    // Generate breadcrumbs
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        return {
            label: routeNames[path] || segment.charAt(0).toUpperCase() + segment.slice(1),
            path,
            isLast: index === segments.length - 1,
        };
    });

    return (
        <header className="h-16 bg-white border-b border-[#F0E0C0] px-8 flex items-center justify-between sticky top-0 z-10">
            <div>
                <h2 className="text-xl font-bold text-[#2C1A00]">{pageName}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.path} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="w-3 h-3" />}
                            <span
                                className={crumb.isLast ? "text-dattes-600 font-medium" : ""}
                            >
                                {crumb.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
}
