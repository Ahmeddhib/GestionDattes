import Link from "next/link";
import { HandCoins, Package, PiggyBank, Plus, Receipt, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";

export interface QuickActionsPermissions {
    canLivraison: boolean; canVente: boolean; canPaiementAgriculteur: boolean;
    canEncaissementClient: boolean; canDepense: boolean; canStock: boolean; canFinance: boolean;
}

export async function QuickActions({ permissions }: { permissions: QuickActionsPermissions }) {
    const t = await getServerTranslations();
    const actions: { show: boolean; href: string; label: string; icon: LucideIcon; tone: string }[] = [
        { show: permissions.canLivraison, href: ROUTES.LIVRAISONS, label: t("dashboard.quickActions.nouvelleLivraison"), icon: Plus, tone: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/25" },
        { show: permissions.canVente, href: ROUTES.VENTES, label: t("dashboard.quickActions.nouvelleVente"), icon: ShoppingCart, tone: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/25" },
        { show: permissions.canPaiementAgriculteur, href: ROUTES.PAIEMENTS_AGRICULTEURS, label: t("dashboard.quickActions.avanceAgriculteur"), icon: HandCoins, tone: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950/25" },
        { show: permissions.canEncaissementClient, href: ROUTES.VENTES, label: t("dashboard.quickActions.encaissementClient"), icon: Wallet, tone: "text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-950/25" },
        { show: permissions.canDepense, href: ROUTES.DEPENSES_AUTRES, label: t("dashboard.quickActions.ajouterDepense"), icon: Receipt, tone: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/25" },
        { show: permissions.canFinance, href: ROUTES.FINANCE, label: t("dashboard.quickActions.bilanFinancier"), icon: PiggyBank, tone: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/25" },
        { show: permissions.canStock, href: ROUTES.STOCK_DATTES, label: t("dashboard.quickActions.consulterStock"), icon: Package, tone: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/25" },
    ];
    const visible = actions.filter((action) => action.show).slice(0, 6);
    if (!visible.length) return null;
    return (
        <section className="dashboard-card h-full rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <h2 className="mb-3 font-semibold text-white">{t("dashboard.premium.quickActionsTitle")}</h2>
            <div className="grid grid-cols-2 gap-2">
                {visible.map(({ href, label, icon: Icon, tone }) => (
                    <Link key={label} href={href} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#eadfce] bg-[#fffdf9] p-2 text-center shadow-sm transition hover:border-[#d6b98e] hover:bg-[#fbf3e7] dark:border-[#624426]/40 dark:bg-black/20 dark:shadow-none dark:hover:border-[#a36c2d]/60 dark:hover:bg-[#38210e]/40">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></span>
                        <span className="text-[11px] leading-4 text-[#e4d8c8]">{label}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
