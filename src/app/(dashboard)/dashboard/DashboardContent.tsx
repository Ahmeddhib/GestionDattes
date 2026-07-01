"use client";

import { StatCard } from "@/components/shared/StatCard";
import { Users, UserCheck, Shield, FileText } from "lucide-react";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type DashboardContentProps = {
    userName: string;
    stats: {
        totalUsers: number;
        activeUsers: number;
        totalRoles: number;
        totalLogs: number;
    };
};

export function DashboardContent({ userName, stats }: DashboardContentProps) {
    const { t } = useClientTranslations();

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#2C1A00] mb-2">
                    {t("common.welcome")}, {userName} 👋
                </h1>
                <p className="text-gray-600">
                    Voici un aperçu de votre système de gestion des dattes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={t("users.total")}
                    value={stats.totalUsers}
                    icon={<Users className="w-6 h-6" />}
                />
                <StatCard
                    title={t("users.active")}
                    value={stats.activeUsers}
                    icon={<UserCheck className="w-6 h-6" />}
                />
                <StatCard
                    title={t("roles.total")}
                    value={stats.totalRoles}
                    icon={<Shield className="w-6 h-6" />}
                />
                <StatCard
                    title={t("nav.auditLogs")}
                    value={stats.totalLogs}
                    icon={<FileText className="w-6 h-6" />}
                />
            </div>
        </div>
    );
}
