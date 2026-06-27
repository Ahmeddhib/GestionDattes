import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/StatCard";
import { Users, UserCheck, Shield, FileText } from "lucide-react";
import { Suspense } from "react";
import { StatsSkeleton } from "@/components/shared/LoadingSkeleton";

export const metadata = {
    title: "Tableau de bord — Gestion des Dattes",
};

async function DashboardStats() {
    const [totalUsers, activeUsers, totalRoles, totalLogs] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.role.count(),
        prisma.auditLog.count(),
    ]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Utilisateurs totaux"
                value={totalUsers}
                icon={<Users className="w-6 h-6" />}
            />
            <StatCard
                title="Utilisateurs actifs"
                value={activeUsers}
                icon={<UserCheck className="w-6 h-6" />}
            />
            <StatCard
                title="Rôles"
                value={totalRoles}
                icon={<Shield className="w-6 h-6" />}
            />
            <StatCard
                title="Logs d'audit"
                value={totalLogs}
                icon={<FileText className="w-6 h-6" />}
            />
        </div>
    );
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#2C1A00] mb-2">
                    Bonjour, {session.user?.name} 👋
                </h1>
                <p className="text-gray-600">
                    Voici un aperçu de votre système de gestion des dattes.
                </p>
            </div>

            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats />
            </Suspense>
        </div>
    );
}
