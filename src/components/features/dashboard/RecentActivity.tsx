import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatKg, formatMontant } from "@/lib/format";
import { getServerTranslations } from "@/i18n/server";
import { Inbox } from "lucide-react";
import type { RecentActivitySection } from "@/types/dashboard";

export async function RecentActivity({ sections }: { sections: RecentActivitySection[] }) {
    if (sections.length === 0) return null;
    const t = await getServerTranslations();

    return (
        <Card className="dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <h3 className="mb-4 text-base font-semibold text-[#2C1A00] dark:text-[#F5E6C8]">
                {t("dashboard.recentActivity.title")}
            </h3>
            <Tabs defaultValue={sections[0].code}>
                <TabsList className="mb-3 flex-wrap">
                    {sections.map((s) => (
                        <TabsTrigger key={s.code} value={s.code} className="text-xs">
                            {s.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {sections.map((s) => (
                    <TabsContent key={s.code} value={s.code}>
                        {s.items.length === 0 ? (
                            <EmptyState icon={<Inbox className="h-8 w-8" />} title={t("dashboard.recentActivity.empty")} />
                        ) : (
                            <ul className="divide-y divide-[#F0E0C0] dark:divide-[#5C2D00]">
                                {s.items.map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className="flex items-center justify-between gap-3 py-2.5 hover:bg-[#FAF0DC] dark:hover:bg-[#3D1C00] -mx-2 px-2 rounded-md"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-[#2C1A00] dark:text-[#F5E6C8]">
                                                    {item.label}
                                                </p>
                                                {item.sousLabel && (
                                                    <p className="truncate text-xs text-gray-500 dark:text-[#B08A5E]">
                                                        {item.sousLabel}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {item.montant != null && (
                                                    <p className="text-sm font-medium text-[#C17A2B]">
                                                        {s.unit === "TND" ? formatMontant(item.montant) : formatKg(item.montant)}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    {item.date.toLocaleDateString("fr-FR")}
                                                </p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="mt-2 text-right">
                            <Link href={s.href} className="text-sm font-medium text-[#C17A2B] hover:underline">
                                {t("dashboard.viewAll")} →
                            </Link>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </Card>
    );
}
