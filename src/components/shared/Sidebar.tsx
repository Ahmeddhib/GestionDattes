"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    LayoutDashboard,
    Users,
    Shield,
    FileText,
    LogOut,
    MapPin,
    Sprout,
    Package,
    Grape,
    Truck,
    PackageCheck,
    UserCircle,
    Contact,
    Scale,
    Receipt,
    Warehouse,
    CalendarRange,
    HandCoins,
    ShoppingCart,
    Wallet2,
    Wallet,
} from "lucide-react";
import { Avatar } from "./Avatar";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { logoutAction } from "@/actions/auth/logout.action";

interface SidebarProps {
    user?: {
        name: string;
        email: string;
        role: string;
    };
    onNavigate?: () => void;
    className?: string;
}

export function Sidebar({ user, onNavigate, className = "" }: SidebarProps) {
    const pathname = usePathname();
    const premiumDashboard = pathname === "/dashboard";
    const { t } = useClientTranslations();

    const menuSections = [
        {
            title: t("dashboard.overview"),
            items: [
                {
                    href: "/dashboard",
                    label: t("nav.dashboard"),
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            title: t("dashboard.management"),
            items: [
                {
                    href: "/dashboard/regions",
                    label: t("nav.regions"),
                    icon: MapPin,
                },
                {
                    href: "/dashboard/agriculteurs",
                    label: t("nav.agriculteurs"),
                    icon: Sprout,
                },
                {
                    href: "/dashboard/types-caisses",
                    label: t("nav.typesCaisses"),
                    icon: Package,
                },
                {
                    href: "/dashboard/types-dates",
                    label: t("nav.typesDates"),
                    icon: Grape,
                },
                {
                    href: "/dashboard/livraisons",
                    label: t("nav.livraisons"),
                    icon: Truck,
                },
                {
                    href: "/dashboard/pesees",
                    label: t("nav.pesees"),
                    icon: Scale,
                },
                {
                    href: "/dashboard/stock-caisses",
                    label: t("nav.stockCaisses"),
                    icon: PackageCheck,
                },
                {
                    href: "/dashboard/stock-dattes",
                    label: t("nav.stockDattes"),
                    icon: Warehouse,
                },
                {
                    href: "/dashboard/bons-achat",
                    label: t("nav.bonsAchat"),
                    icon: Receipt,
                },
                {
                    href: "/dashboard/clients",
                    label: t("nav.clients"),
                    icon: UserCircle,
                },
                {
                    href: "/dashboard/livreurs",
                    label: t("nav.livreurs"),
                    icon: Contact,
                },
            ],
        },
        {
            title: t("dashboard.finance"),
            items: [
                {
                    href: "/dashboard/finance",
                    label: t("nav.bilanFinancier"),
                    icon: Wallet,
                },
                {
                    href: "/dashboard/finance/paiements-agriculteurs",
                    label: t("nav.paiementsAgriculteurs"),
                    icon: HandCoins,
                },
                {
                    href: "/dashboard/finance/ventes",
                    label: t("nav.ventes"),
                    icon: ShoppingCart,
                },
                {
                    href: "/dashboard/finance/depenses",
                    label: t("nav.depensesAutres"),
                    icon: Wallet2,
                },
                {
                    href: "/dashboard/finance/saisons",
                    label: t("nav.saisons"),
                    icon: CalendarRange,
                },
            ],
        },
        {
            title: t("dashboard.administration"),
            items: [
                {
                    href: "/dashboard/users",
                    label: t("nav.users"),
                    icon: Users,
                },
                {
                    href: "/dashboard/roles",
                    label: t("nav.roles"),
                    icon: Shield,
                },
                {
                    href: "/dashboard/audit-logs",
                    label: t("nav.auditLogs"),
                    icon: FileText,
                },
            ],
        },
    ];

    // L'entrée active est le lien le PLUS SPÉCIFIQUE qui préfixe l'URL. Une
    // égalité stricte n'allumait rien sur les sous-pages (ex.
    // /dashboard/finance/saisons/<id>), et un simple startsWith allumerait
    // « Bilan financier » en même temps que « Ventes ».
    const activeHref = menuSections
        .flatMap((section) => section.items.map((item) => item.href))
        .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
        .sort((a, b) => b.length - a.length)[0];

    return (
        // `cn` et non une interpolation : `w-full` (defaut, pour remplir le
        // tiroir mobile) doit pouvoir etre ecrase par le `w-64` passe par le
        // layout. Concatener ne suffit pas — c'est l'ordre dans la feuille CSS
        // qui tranche, pas l'ordre dans l'attribut class.
        <aside
            className={cn(
                "flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#3D1C00] text-white",
                premiumDashboard && "bg-[#2b1707] bg-[linear-gradient(180deg,rgba(43,23,7,.90),rgba(51,26,7,.82)),url('/dashboard-date-palm-bg.png')] bg-cover bg-left-bottom dark:bg-[#0d0a07] dark:bg-[linear-gradient(180deg,rgba(11,8,5,.92),rgba(14,9,5,.82)),url('/dashboard-date-palm-bg.png')]",
                className
            )}
        >
            {/* Logo */}
            <div className={cn("shrink-0 border-b border-white/10 p-4", premiumDashboard && "bg-[#2a1607]/30 backdrop-blur-sm dark:bg-black/20")}>
                <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dattes-200">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f7f3e9]">
                        <Image src="/kayen-logo.jpg" alt="Logo Kayen Fruits Packaging" fill sizes="48px" className="object-cover" priority />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-bold text-dattes-100">KAYEN</h1>
                        <p className="truncate text-[10px] tracking-wide text-dattes-300">FRUITS PACKAGING</p>
                    </div>
                </Link>
            </div>

            {/* Navigation. Le dégradé de bas de liste est le seul indice fiable
                qu'il reste des entrées : la barre de défilement est en mode
                overlay sur la plupart des plateformes et ne s'affiche que
                pendant le geste. Sans lui, la dernière entrée visible semble
                coupée par erreur. */}
            <div className="relative min-h-0 flex-1">
            <nav className="sidebar-scroll h-full overflow-y-auto overscroll-contain pb-4">
                {menuSections.map((section) => (
                    <div key={section.title}>
                        {/* Titre de section collant : avec 22 entrées, la section
                            en cours doit rester lisible pendant le défilement. */}
                        <div className={cn("sticky top-0 z-10 bg-[#3D1C00]/95 px-6 pb-2 pt-4 backdrop-blur-sm", premiumDashboard && "bg-[#2b1707]/90 dark:bg-[#0d0a07]/90")}>
                            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-dattes-300">
                                {section.title}
                            </h3>
                        </div>

                        {/* Section Items */}
                        <div className="space-y-0.5 px-3">
                            {section.items.map((item) => {
                                const isActive = item.href === activeHref;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={isActive ? "page" : undefined}
                                        className={cn(
                                            // min-h-11 = cible tactile de 44px dans le tiroir mobile,
                                            // resserrée à 40px sur grand écran où le pointeur est précis.
                                            "relative flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors lg:min-h-10",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dattes-200",
                                            isActive
                                                ? premiumDashboard
                                                    ? "border border-[#8b5b23]/45 bg-[#7a4517]/35 font-semibold text-[#f0b548] shadow-[inset_0_0_24px_rgba(193,122,43,.12)]"
                                                    : "bg-dattes-600 font-semibold text-white"
                                                : "text-white/85 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {isActive && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-y-1.5 inset-s-0 w-1 rounded-full bg-dattes-200"
                                            />
                                        )}
                                        <Icon className="h-4.5 w-4.5 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
                <div
                    aria-hidden
                    className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-[#3D1C00] to-transparent", premiumDashboard && "from-[#2b1707] dark:from-[#0d0a07]")}
                />
            </div>

            {/* User Info */}
            {user && (
                <div className={cn("shrink-0 border-t border-white/10 bg-[#3D1C00] p-4", premiumDashboard && "bg-[#2a1607]/55 backdrop-blur-md dark:bg-black/35")}>
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar name={user.name} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-dattes-300 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                        onClick={async () => {
                            // Nettoyer les données de wakala côté client
                            sessionStorage.removeItem("selectedWakalaId");
                            sessionStorage.removeItem("selectedWakalaCode");
                            sessionStorage.removeItem("userEmail");

                            // Afficher le toast AVANT la redirection
                            toast.success("Déconnexion en cours...");

                            // Appeler l'action serveur pour nettoyer les cookies et se déconnecter
                            // Note: signOut va rediriger, donc le code après ne sera pas exécuté
                            await logoutAction();
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        {t("common.logout")}
                    </button>
                </div>
            )}
        </aside>
    );
}
