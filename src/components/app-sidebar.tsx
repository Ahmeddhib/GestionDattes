"use client";

import * as React from "react";
import type { Session } from "next-auth";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
    LayoutDashboardIcon,
    UsersIcon,
    ShieldCheckIcon,
    ClipboardListIcon,
    SettingsIcon,
    HelpCircleIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    session: Session;
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
    const isAdmin = session.user?.role === "ADMIN";

    const navMain = [
        {
            title: "Dashboard",
            url: ROUTES.DASHBOARD,
            icon: <LayoutDashboardIcon />,
        },
        ...(isAdmin
            ? [
                  {
                      title: "Utilisateurs",
                      url: ROUTES.USERS,
                      icon: <UsersIcon />,
                  },
                  {
                      title: "Rôles",
                      url: ROUTES.ROLES,
                      icon: <ShieldCheckIcon />,
                  },
                  {
                      title: "Audit Logs",
                      url: ROUTES.AUDIT_LOGS,
                      icon: <ClipboardListIcon />,
                  },
              ]
            : []),
    ];

    const navSecondary = [
        {
            title: "Paramètres",
            url: "#",
            icon: <SettingsIcon />,
        },
        {
            title: "Aide",
            url: "#",
            icon: <HelpCircleIcon />,
        },
    ];

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:p-1.5!"
                        >
                            <a href={ROUTES.DASHBOARD}>
                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064" />
                                    </svg>
                                </div>
                                <span className="text-base font-semibold">Gestion Dattes</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={{
                    name: session.user?.name ?? "Utilisateur",
                    email: session.user?.email ?? "",
                    role: session.user?.role ?? "",
                }} />
            </SidebarFooter>
        </Sidebar>
    );
}
