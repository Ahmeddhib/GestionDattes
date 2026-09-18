"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { FileText } from "lucide-react";
import { ActionBadge } from "./ActionBadge";
import { formatDistanceToNow } from "date-fns";
import { arSA, enUS, fr } from "date-fns/locale";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface AuditLog {
    id: string;
    action: string;
    description: string | null;
    createdAt: Date;
    actor: {
        id: string;
        name: string;
        email: string;
    };
}

interface AuditLogsTableProps {
    initialData: AuditLog[];
    initialTotal: number;
}

export function AuditLogsTable({ initialData, initialTotal }: AuditLogsTableProps) {
    const { t, locale } = useClientTranslations();
    const [data] = useState(initialData);
    const [total] = useState(initialTotal);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);
    const dateLocale = locale === "ar" ? arSA : locale === "en" ? enUS : fr;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // TODO: Refetch data for new page
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#efd6b5] bg-[#fff1dc] text-[#b46b1d] dark:border-[#6b4b29]/60 dark:bg-[#352313] dark:text-[#f0b654]">
                    <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold text-foreground">{t("auditPage.title")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("auditPage.description")}</p>
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden !p-0">
                {data.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="w-12 h-12" />}
                        title={t("auditPage.noResults")}
                        description={t("auditPage.noResultsDescription")}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/55">
                                <tr className="border-b border-border">
                                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                        {t("auditPage.user")}
                                    </th>
                                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                        {t("auditPage.action")}
                                    </th>
                                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                        {t("auditPage.descriptionColumn")}
                                    </th>
                                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                        {t("auditPage.date")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/45"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={log.actor.name} size="sm" />
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">
                                                        {log.actor.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {log.actor.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="py-4 px-4 text-muted-foreground">
                                            {log.description || "—"}
                                        </td>
                                        <td className="py-4 px-4 text-muted-foreground text-sm">
                                            {formatDistanceToNow(new Date(log.createdAt), {
                                                addSuffix: true,
                                                locale: dateLocale,
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
}
