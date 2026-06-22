import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STAT_CARDS = [
    {
        label: "Total Utilisateurs",
        key: "totalUsers",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        gradient: "from-violet-500 to-purple-600",
        bg: "from-violet-50 to-purple-50",
        border: "border-violet-100",
        text: "text-violet-700",
        href: ROUTES.USERS,
    },
    {
        label: "Utilisateurs Actifs",
        key: "activeUsers",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        gradient: "from-emerald-500 to-teal-600",
        bg: "from-emerald-50 to-teal-50",
        border: "border-emerald-100",
        text: "text-emerald-700",
        href: ROUTES.USERS,
    },
    {
        label: "Rôles Définis",
        key: "totalRoles",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        gradient: "from-indigo-500 to-blue-600",
        bg: "from-indigo-50 to-blue-50",
        border: "border-indigo-100",
        text: "text-indigo-700",
        href: ROUTES.ROLES,
    },
    {
        label: "Logs d'Audit",
        key: "totalLogs",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
        ),
        gradient: "from-amber-500 to-orange-600",
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-100",
        text: "text-amber-700",
        href: ROUTES.AUDIT_LOGS,
    },
];

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect(ROUTES.LOGIN);

    const [totalUsers, activeUsers, totalRoles, totalLogs] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { active: true } }),
        prisma.role.count(),
        prisma.auditLog.count(),
    ]);

    const stats: Record<string, number> = { totalUsers, activeUsers, totalRoles, totalLogs };

    const recentLogs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, email: true } } },
    });

    const ACTION_MAP: Record<string, { label: string; color: string }> = {
        CREATE_USER:     { label: "Création",        color: "bg-green-100 text-green-700" },
        UPDATE_USER:     { label: "Modification",    color: "bg-blue-100 text-blue-700" },
        ACTIVATE_USER:   { label: "Activation",      color: "bg-teal-100 text-teal-700" },
        DEACTIVATE_USER: { label: "Désactivation",   color: "bg-orange-100 text-orange-700" },
        CHANGE_ROLE:     { label: "Changement rôle", color: "bg-purple-100 text-purple-700" },
    };

    return (
        <div className="min-h-screen mesh-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Header */}
                <div className="mb-10 animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Bonjour, <span className="gradient-text">{session.user.name}</span> 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Voici un aperçu de votre système de gestion des dattes.
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {STAT_CARDS.map((card, i) => (
                        <Link
                            key={card.key}
                            href={card.href}
                            style={{ animationDelay: `${i * 100}ms`, opacity: 0 }}
                            className={`animate-fade-in-up card-hover block rounded-2xl bg-gradient-to-br ${card.bg} border ${card.border} p-6 shadow-sm`}
                        >
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg mb-4`}>
                                {card.icon}
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{stats[card.key]}</p>
                            <p className={`text-sm font-medium mt-1 ${card.text}`}>{card.label}</p>
                        </Link>
                    ))}
                </div>

                {/* Recent Logs */}
                <div
                    style={{ animationDelay: "400ms", opacity: 0 }}
                    className="animate-fade-in-up glass rounded-2xl border border-white/60 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Activité Récente</h2>
                        <Link href={ROUTES.AUDIT_LOGS} className="text-xs text-violet-600 hover:underline font-medium">
                            Voir tout →
                        </Link>
                    </div>

                    {recentLogs.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                            </svg>
                            Aucune activité récente
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentLogs.map((log) => {
                                const meta = ACTION_MAP[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-700" };
                                return (
                                    <div key={log.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {log.actor.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{log.actor.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{log.description}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                        <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                                            {new Date(log.createdAt).toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
