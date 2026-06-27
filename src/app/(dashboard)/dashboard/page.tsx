import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { RecentActivityTable } from "@/components/recent-activity-table";

export const metadata = {
    title: "Dashboard — Gestion des Dattes",
};

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    let totalUsers = 0;
    let activeUsers = 0;
    let totalRoles = 0;
    let totalLogs = 0;
    let recentLogs: any[] = [];

    try {
        totalUsers = await prisma.user.count();
        activeUsers = await prisma.user.count({ where: { active: true } });
        totalRoles = await prisma.role.count();
        totalLogs = await prisma.auditLog.count();
        recentLogs = await prisma.auditLog.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            include: { actor: { select: { name: true, email: true } } },
        });
    } catch (error) {
        console.error("Dashboard DB Error:", error);
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Greeting banner */}
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    Bonjour, {session.user?.name} 👋
                </h2>
            </div>
            
            <p className="text-sm text-muted-foreground -mt-2 mb-2">
                Voici un aperçu de votre système de gestion des dattes.
            </p>

            {/* Stat cards */}
            <SectionCards
                totalUsers={totalUsers}
                activeUsers={activeUsers}
                totalRoles={totalRoles}
                totalLogs={totalLogs}
            />

            {/* Main content grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <ChartAreaInteractive />
                </div>
                <div className="col-span-3">
                    <RecentActivityTable logs={recentLogs} />
                </div>
            </div>
        </div>
    );
}
