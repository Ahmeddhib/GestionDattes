"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { UpdateRoleDialog } from "./UpdateRoleDialog";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface Role {
    id: string;
    name: string;
    description: string | null;
    _count: {
        users: number;
    };
    createdAt: Date;
}

interface RolesTableProps {
    initialData: Role[];
    initialTotal: number;
}

export function RolesTable({ initialData, initialTotal }: RolesTableProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);

    const pageSize = 10;
    const totalPages = Math.ceil(initialTotal / pageSize);

    const handleSearch = () => {
        setCurrentPage(1);
        // TODO: Refetch data with search filter
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // TODO: Refetch data for new page
    };

    const handleRoleCreated = () => {
        setShowCreateDialog(false);
        router.refresh();
    };

    const handleRoleUpdated = () => {
        setEditingRole(null);
        router.refresh();
    };

    const handleRoleDeleted = () => {
        setDeletingRole(null);
        router.refresh();
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#efd6b5] bg-[#fff1dc] text-[#b46b1d] dark:border-[#6b4b29]/60 dark:bg-[#352313] dark:text-[#f0b654]">
                            <Shield className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-foreground">{t("roles.title")}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{t("roles.description")}</p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateDialog(true)}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("roles.createNew")}
                    </Button>
                </div>

                {/* Search */}
                <SearchBar
                    placeholder={t("roles.searchPlaceholder")}
                    onSearch={handleSearch}
                />

                {/* Table */}
                <Card className="overflow-hidden !p-0">
                    {initialData.length === 0 ? (
                        <EmptyState
                            icon={<Shield className="w-12 h-12" />}
                            title={t("roles.noResults")}
                            description={t("roles.noResultsDescription")}
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("roles.createNew")}
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/55">
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("roles.name")}
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("roles.description")}
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("roles.users")}
                                        </th>
                                        <th className="px-4 py-3 text-end font-semibold text-muted-foreground">
                                            {t("common.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialData.map((role) => (
                                        <tr
                                            key={role.id}
                                            className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/45"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#efd6b5] bg-[#fff1dc] dark:border-[#6b4b29]/60 dark:bg-[#352313]">
                                                        <Shield className="h-5 w-5 text-[#b46b1d] dark:text-[#f0b654]" />
                                                    </div>
                                                    <span className="font-medium text-foreground">
                                                        {role.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-muted-foreground">
                                                {role.description || "—"}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="secondary">
                                                    {role._count.users} {role._count.users > 1 ? t("roles.usersCount") : t("roles.userCount")}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingRole(role)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setDeletingRole(role)}
                                                        disabled={role._count.users > 0}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
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

            {/* Dialogs */}
            {showCreateDialog && (
                <CreateRoleDialog
                    open={showCreateDialog}
                    onClose={handleRoleCreated}
                />
            )}

            {editingRole && (
                <UpdateRoleDialog
                    role={editingRole}
                    open={!!editingRole}
                    onClose={handleRoleUpdated}
                />
            )}

            {deletingRole && (
                <DeleteRoleDialog
                    role={deletingRole}
                    open={!!deletingRole}
                    onClose={handleRoleDeleted}
                />
            )}
        </>
    );
}
