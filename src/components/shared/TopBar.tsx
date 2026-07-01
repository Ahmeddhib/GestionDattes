"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function TopBar() {
    const pathname = usePathname();
    const { t } = useClientTranslations();

    // Map routes to translation keys
    const routeTranslationKeys: Record<string, string> = {
        "/dashboard": "nav.dashboard",
        "/dashboard/users": "nav.users",
        "/dashboard/roles": "nav.roles",
        "/dashboard/audit-logs": "nav.auditLogs",
        "/dashboard/regions": "nav.regions",
        "/dashboard/agriculteurs": "nav.agriculteurs",
    };

    const pageName = t(routeTranslationKeys[pathname] || "nav.dashboard");

    // Generate breadcrumbs
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        return {
            label: t(routeTranslationKeys[path] || "common.loading"),
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

            {/* Language Switcher */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
            </div>
        </header>
    );
}
