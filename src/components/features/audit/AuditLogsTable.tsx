"use client";

import { useState } from "react";
import { Card } from "@/components/shared/Card";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { FileText } from "lucide-react";
import { ActionBadge } from "./ActionBadge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

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
    const [data] = useState(initialData);
    const [total] = useState(initialTotal);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // TODO: Refetch data for new page
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-[#2C1A00]">Journal d'audit</h2>
                <p className="text-gray-600 mt-1">
                    Historique de toutes les actions effectuées dans le système
                </p>
            </div>

            {/* Table */}
            <Card>
                {data.length === 0 ? (
                    <EmptyState
                        icon={<FileText className="w-12 h-12" />}
                        title="Aucun log trouvé"
                        description="Les actions effectuées dans le système apparaîtront ici"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#F0E0C0]">
                                    <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                        Utilisateur
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                        Action
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                        Description
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="border-b border-[#F0E0C0] last:border-0 hover:bg-sand/30 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={log.actor.name} size="sm" />
                                                <div>
                                                    <div className="font-medium text-[#2C1A00] text-sm">
                                                        {log.actor.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {log.actor.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td className="py-4 px-4 text-gray-600">
                                            {log.description || "—"}
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">
                                            {formatDistanceToNow(new Date(log.createdAt), {
                                                addSuffix: true,
                                                locale: fr,
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
