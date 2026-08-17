import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import type { TopAgriculteurDatum } from "@/types/dashboard";
import { getServerTranslations } from "@/i18n/server";

export async function TopAgriculteursTable({ data, periodLabel }: { data: TopAgriculteurDatum[]; periodLabel?: string }) {
    const t = await getServerTranslations();
    return (
        <section className="dashboard-card h-full rounded-2xl border border-[#6b4b29]/45 bg-[#14100c]/86 p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-white">{t("dashboard.topAgriculteurs.title")}</h2>
                <Link href={ROUTES.LIVRAISONS} className="inline-flex items-center gap-1 rounded-lg border border-[#dfcfb9] bg-[#fbf5ec] px-2 py-1 text-[10px] text-[#7e684e] hover:text-[#b76d17] dark:border-[#6b4b29]/35 dark:bg-black/10 dark:text-[#9f907c] dark:hover:text-[#e6a73c]">{periodLabel ?? t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 rtl:rotate-180" /></Link>
            </div>
            {data.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8e806e]">{t("dashboard.topAgriculteurs.empty")}</div>
            ) : (
                <div>
                    <div className="grid grid-cols-[24px_1fr_auto_auto] gap-2 border-b border-[#5b4027]/35 pb-2 text-[10px] uppercase tracking-wide text-[#746858]">
                        <span>#</span><span>{t("dashboard.topAgriculteurs.agriculteur")}</span><span>{t("dashboard.topAgriculteurs.quantiteLivree")}</span><span>{t("dashboard.premium.deliveriesShort")}</span>
                    </div>
                    {data.map((item, index) => (
                        <div key={item.agriculteurId} className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-2 border-b border-[#5b4027]/25 py-2.5 text-xs last:border-0">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full font-semibold ${index === 0 ? "bg-[#c17a2b] text-[#1c1005]" : "bg-[#b78b55]/15 text-[#7b5b37] dark:bg-white/10 dark:text-[#c9b9a3]"}`}>{index + 1}</span>
                            <span className="min-w-0 truncate text-[#e2d5c5]">{item.nom}</span>
                            <strong className="whitespace-nowrap text-white">{formatKg(item.quantiteLivree)}</strong>
                            <span className="w-7 text-right text-[#9f907c]">{item.nombreLivraisons}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
