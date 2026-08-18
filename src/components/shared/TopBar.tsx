"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import WakalaSwitcher from "./WakalaSwitcher";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

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
        name: string;
        email: string;
        role: string;
    };
}

export function TopBar({ user }: TopBarProps) {
    const pathname = usePathname();
    const premiumDashboard = pathname.startsWith("/dashboard");
    const { t } = useClientTranslations();
    const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
    const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

    // Fetch available tenants for the user
    useEffect(() => {
        if (!user?.id) return;

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);

        fetch(`/api/tenants/user/${user.id}`, { signal: controller.signal })
            .then(async (res) => {
                if (!res.ok) return null;
                return res.json() as Promise<{ tenants?: Tenant[] }>;
            })
            .then((data) => {
                if (data?.tenants) setAvailableTenants(data.tenants);
            })
            .catch(() => undefined)
            .finally(() => window.clearTimeout(timeout));

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [user?.id]);

    // Map routes to translation keys
    const routeTranslationKeys: Record<string, string> = {
        "/dashboard": "nav.dashboard",
        "/dashboard/users": "nav.users",
        "/dashboard/roles": "nav.roles",
        "/dashboard/audit-logs": "nav.auditLogs",
        "/dashboard/regions": "nav.regions",
        "/dashboard/agriculteurs": "nav.agriculteurs",
        "/dashboard/types-caisses": "nav.typesCaisses",
        "/dashboard/types-dates": "nav.typesDates",
        "/dashboard/livraisons": "nav.livraisons",
        "/dashboard/stock-caisses": "nav.stockCaisses",
    };

    const pageName = t(routeTranslationKeys[pathname] || "nav.dashboard");

    // Generate breadcrumbs
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const translationKey = routeTranslationKeys[path];
        return {
            label: translationKey ? t(translationKey) : segment,
            path,
            isLast: index === segments.length - 1,
        };
    });

    return (
        // `shrink-0` et non `sticky` : l'en-tête est un frère de <main> dans un
        // shell à hauteur d'écran, donc il reste en place sans position collante.
        <header className={premiumDashboard
            ? "relative z-30 flex min-h-14 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-[#eadfd0] bg-white/95 px-3 py-2 text-[#2f2317] backdrop-blur-md dark:border-[#5b4027]/45 dark:bg-[#0b0907]/95 dark:text-white sm:px-5 lg:px-6"
            : "relative z-30 flex min-h-16 w-full min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-3 py-2 sm:px-5 lg:px-8"}>
            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 lg:hidden"
                    onClick={() => setMobileNavigationOpen(true)}
                    aria-label="Ouvrir le menu de navigation"
                    aria-expanded={mobileNavigationOpen}
                >
                    <Menu className="h-5 w-5" />
                </Button>
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
                        <div className={premiumDashboard ? "hidden h-8 border-s border-[#5b4027] sm:block" : "hidden h-8 border-s border-gray-200 sm:block"} />
                    </>
                )}

                <div className={premiumDashboard ? "hidden min-w-0 lg:block" : "min-w-0"}>
                    <h2 className={premiumDashboard ? "truncate text-sm font-medium text-[#6f5d48] dark:text-[#c9b9a3]" : "truncate text-base font-bold text-text-primary sm:text-xl"}>{pageName}</h2>
                    <div className="mt-1 hidden min-w-0 items-center gap-2 overflow-hidden text-sm text-gray-600 md:flex">
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
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <ThemeToggle premium={premiumDashboard} />
                <LanguageSwitcher />
            </div>

            <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
                <SheetContent side="left" showCloseButton={false} className="w-[min(88vw,20rem)] border-0 bg-[#3D1C00] p-0 sm:max-w-80">
                    <SheetTitle className="sr-only">Navigation principale</SheetTitle>
                    <Sidebar
                        user={user ? { name: user.name, email: user.email, role: user.role } : undefined}
                        onNavigate={() => setMobileNavigationOpen(false)}
                    />
                </SheetContent>
            </Sheet>
        </header>
    );
}
