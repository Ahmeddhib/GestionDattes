import { CalendarDays, MapPin } from "lucide-react";
import { getServerTranslations } from "@/i18n/server";
import type { ReactNode } from "react";

interface DashboardHeaderProps {
    userName: string;
    wakalaName: string;
    saisonActive: { nom: string; statut: string; dateFin: Date } | null;
    canSeeSaison: boolean;
    filters?: ReactNode;
}

export async function DashboardHeader({ userName, wakalaName, saisonActive, canSeeSaison, filters }: DashboardHeaderProps) {
    const t = await getServerTranslations();
    const firstName = userName.trim().split(/\s+/)[0] || userName;

    return (
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {t("dashboard.premium.greeting", { name: firstName })} <span aria-hidden>👋</span>
                </h1>
                <p className="mt-1 text-sm text-[#b8a995]">{t("dashboard.premium.subtitle")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#9f907c]">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#d39735]" />{wakalaName}</span>
                    {canSeeSaison && saisonActive && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#dfcfb9] bg-white/75 px-3 py-1 shadow-sm dark:border-[#614322]/60 dark:bg-black/20 dark:shadow-none">
                            <CalendarDays className="h-3.5 w-3.5 text-[#d39735]" />
                            {saisonActive.nom}
                            <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:border-green-700/40 dark:bg-green-900/50 dark:text-green-300">
                                {t("finance.saisons.ouverte")}
                            </span>
                        </span>
                    )}
                </div>
            </div>
            <div className="w-full xl:w-auto">{filters}</div>
        </header>
    );
}
