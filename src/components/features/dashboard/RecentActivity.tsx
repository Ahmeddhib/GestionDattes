import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { arTN, enUS, fr } from "date-fns/locale";
import { ArrowRight, HandCoins, PackageOpen, ReceiptText, ShoppingCart, Truck, Wallet, type LucideIcon } from "lucide-react";
import { formatKg, formatMontant } from "@/lib/format";
import type { RecentActivitySection } from "@/types/dashboard";
import { getServerLocale, getServerTranslations } from "@/i18n/server";

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
    livraisons: { icon: Truck, tone: "bg-green-100 text-green-600 dark:bg-green-950/55 dark:text-green-400" },
    bonsAchat: { icon: ReceiptText, tone: "bg-amber-100 text-amber-600 dark:bg-amber-950/55 dark:text-amber-400" },
    paiementsAgriculteurs: { icon: HandCoins, tone: "bg-orange-100 text-orange-600 dark:bg-orange-950/55 dark:text-orange-400" },
    ventes: { icon: ShoppingCart, tone: "bg-lime-100 text-lime-600 dark:bg-lime-950/55 dark:text-lime-400" },
    encaissements: { icon: Wallet, tone: "bg-sky-100 text-sky-600 dark:bg-sky-950/55 dark:text-sky-400" },
    mouvementsStock: { icon: PackageOpen, tone: "bg-purple-100 text-purple-600 dark:bg-purple-950/55 dark:text-purple-400" },
};

export async function RecentActivity({ sections }: { sections: RecentActivitySection[] }) {
    const [t, locale] = await Promise.all([getServerTranslations(), getServerLocale()]);
    const dateLocale = locale === "ar" ? arTN : locale === "en" ? enUS : fr;
    const items = sections
        .flatMap((section) => section.items.slice(0, 2).map((item) => ({ ...item, section })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    if (!sections.length) return null;

    return (
        <section className="dashboard-card h-full rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold text-white">{t("dashboard.recentActivity.title")}</h2>
                <Link href={sections[0].href} className="inline-flex items-center gap-1 text-[11px] text-[#9f907c] hover:text-[#e6a73c]">{t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 rtl:rotate-180" /></Link>
            </div>
            {items.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e806e]">{t("dashboard.recentActivity.empty")}</div>
            ) : (
                <div className="divide-y divide-[#5b4027]/30">
                    {items.map((item) => {
                        const config = ICONS[item.section.code] ?? ICONS.mouvementsStock;
                        const Icon = config.icon;
                        return (
                            <Link key={`${item.section.code}-${item.id}`} href={item.href} className="flex items-center gap-3 rounded-lg py-2.5 transition hover:bg-[#f8efe2]/70 dark:hover:bg-card/[.02]">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.tone}`}><Icon className="h-4 w-4" /></span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">{item.section.title} · {item.label}</p>
                                    <p className="truncate text-[10px] text-[#8e806e]">{item.sousLabel ?? (item.montant != null ? (item.section.unit === "kg" ? formatKg(item.montant) : formatMontant(item.montant)) : "")}</p>
                                </div>
                                <time className="shrink-0 text-[10px] text-[#776b5c]">{formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: dateLocale })}</time>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
