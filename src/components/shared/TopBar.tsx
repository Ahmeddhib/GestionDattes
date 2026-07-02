"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import WakalaSwitcher from "./WakalaSwitcher";
import { useEffect, useState } from "react";

interface Tenant {
    id: string;
    name: string;
    code: string;
    role: {
        id: string;
        name: string;
    };
}

interface TopBarProps {
    user?: {
        id: string;
        tenantId?: string;
        tenantName?: string;
        tenantCode?: string;
    };
}

export function TopBar({ user }: TopBarProps) {
    const pathname = usePathname();
    const { t } = useClientTranslations();
    const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

    // Fetch available tenants for the user
    useEffect(() => {
        if (user?.id) {
            fetch(`/api/tenants/user/${user.id}`)
                .then((res) => res.json())
                .then((data) => setAvailableTenants(data.tenants || []))
                .catch((err) => console.error("Error fetching tenants:", err));
        }
    }, [user?.id]);

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
            <div className="flex items-center gap-4">
                {/* Wakala Switcher - Only show if tenant selected */}
                {user?.tenantId && (
                    <>
                        <WakalaSwitcher
                            currentTenant={{
                                id: user.tenantId,
                                name: user.tenantName || "",
                                code: user.tenantCode || "",
                            }}
                            availableTenants={availableTenants}
                        />
                        <div className="border-l border-gray-200 h-8" />
                    </>
                )}

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
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
            </div>
        </header>
    );
}
