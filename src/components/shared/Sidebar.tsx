"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Shield,
    FileText,
    LogOut,
} from "lucide-react";
import { Avatar } from "./Avatar";

interface SidebarProps {
    user?: {
        name: string;
        email: string;
        role: string;
    };
}

const menuItems = [
    {
        href: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
    },
    {
        href: "/dashboard/users",
        label: "Utilisateurs",
        icon: Users,
    },
    {
        href: "/dashboard/roles",
        label: "Rôles",
        icon: Shield,
    },
    {
        href: "/dashboard/audit-logs",
        label: "Journal d'audit",
        icon: FileText,
    },
];

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 min-h-screen bg-[#3D1C00] text-white flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <h1 className="text-2xl font-bold text-dattes-200">
                    Gestion Dattes
                </h1>
                <p className="text-xs text-dattes-300 mt-1">Système ERP</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-[9px] transition-all",
                                "hover:bg-white/10",
                                isActive && "bg-dattes-600 text-white shadow-lg"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Info */}
            {user && (
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar name={user.name} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-dattes-300 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-[9px] bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                        onClick={() => {
                            // TODO: Handle logout
                            window.location.href = "/api/auth/signout";
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                    </button>
                </div>
            )}
        </aside>
    );
}
