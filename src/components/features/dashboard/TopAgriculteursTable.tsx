import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKg } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { getServerTranslations } from "@/i18n/server";
import { Users } from "lucide-react";
import Link from "next/link";
import type { TopAgriculteurDatum } from "@/types/dashboard";

export async function TopAgriculteursTable({ data }: { data: TopAgriculteurDatum[] }) {
    const t = await getServerTranslations();
    const max = Math.max(1, ...data.map((d) => d.quantiteLivree));

    return (
        <Card className="flex h-full flex-col dark:bg-[#2A1800] dark:border-[#5C2D00]">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-[#2C1A00] dark:text-[#F5E6C8]">
                        {t("dashboard.topAgriculteurs.title")}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-[#B08A5E]">
                        {t("dashboard.topAgriculteurs.description")}
                    </p>
                </div>
                <Link href={ROUTES.LIVRAISONS} className="shrink-0 text-sm font-medium text-[#C17A2B] hover:underline">
                    {t("dashboard.viewModule")}
                </Link>
            </div>

            {data.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <EmptyState icon={<Users className="h-10 w-10" />} title={t("dashboard.topAgriculteurs.empty")} />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("dashboard.topAgriculteurs.agriculteur")}</TableHead>
                            <TableHead className="text-right">{t("dashboard.topAgriculteurs.quantiteLivree")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((d) => (
                            <TableRow key={d.agriculteurId}>
                                <TableCell className="text-[#2C1A00] dark:text-[#F5E6C8]">{d.nom}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F0E0C0] dark:bg-[#5C2D00]">
                                            <div
                                                className="h-full rounded-full bg-[#C17A2B]"
                                                style={{ width: `${(d.quantiteLivree / max) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[#2C1A00] dark:text-[#F5E6C8]">
                                            {formatKg(d.quantiteLivree)}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </Card>
    );
}
