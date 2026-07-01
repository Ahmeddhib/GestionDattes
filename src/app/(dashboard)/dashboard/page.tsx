import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { DashboardContent } from "./DashboardContent";

export const metadata = {
    title: "Tableau de bord — Gestion des Dattes",
};

async function getDashboardStats() {
    const [totalUsers, activeUsers, totalRoles, totalLogs] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.role.count(),
        prisma.auditLog.count(),
    ]);

    return {
        totalUsers,
        activeUsers,
        totalRoles,
        totalLogs,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const stats = await getDashboardStats();

    return <DashboardContent userName={session.user?.name || ""} stats={stats} />;
}
