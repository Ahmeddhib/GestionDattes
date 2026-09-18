"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { Plus, Edit, UserCheck, UserX, Users } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";
import { UpdateUserDialog } from "./UpdateUserDialog";
import { activateUserAction } from "@/actions/users/activate-user.action";
import { deactivateUserAction } from "@/actions/users/deactivate-user.action";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface User {
    id: string;
    name: string;
    email: string;
    active: boolean;
    role: {
        id: string;
        name: string;
    };
    createdAt: Date;
}

interface UsersTableProps {
    initialData: User[];
    initialTotal: number;
    roles: Array<{ id: string; name: string }>;
}

export function UsersTable({ initialData, initialTotal, roles }: UsersTableProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

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

    const handleToggleStatus = async (user: User) => {
        setLoading(user.id);
        try {
            const result = user.active
                ? await deactivateUserAction(user.id)
                : await activateUserAction(user.id);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : t("messages.error.generic"));
            } else {
                toast.success(user.active ? t("users.deactivated") : t("users.activated"));
                router.refresh();
            }
        } catch {
            toast.error(t("messages.error.generic"));
        } finally {
            setLoading(null);
        }
    };

    const handleUserCreated = () => {
        // Fermer le dialog
        setShowCreateDialog(false);
        // Rafraîchir la page pour obtenir les nouvelles données
        router.refresh();
    };

    const handleUserUpdated = () => {
        setEditingUser(null);
        router.refresh();
    };

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#efd6b5] bg-[#fff1dc] text-[#b46b1d] dark:border-[#6b4b29]/60 dark:bg-[#352313] dark:text-[#f0b654]">
                            <Users className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-2xl font-bold text-foreground">{t("users.title")}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{t("users.description")}</p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateDialog(true)}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t("users.createNew")}
                    </Button>
                </div>

                {/* Search */}
                <SearchBar
                    placeholder={t("users.searchPlaceholder")}
                    onSearch={handleSearch}
                />

                {/* Table */}
                <Card className="overflow-hidden !p-0">
                    {initialData.length === 0 ? (
                        <EmptyState
                            icon={<Users className="w-12 h-12" />}
                            title={t("users.noResults")}
                            description={t("users.noResultsDescription")}
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t("users.createNew")}
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/55">
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("users.name")}
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("users.role")}
                                        </th>
                                        <th className="px-4 py-3 text-start font-semibold text-muted-foreground">
                                            {t("users.status")}
                                        </th>
                                        <th className="px-4 py-3 text-end font-semibold text-muted-foreground">
                                            {t("common.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {initialData.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/45"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.name} size="md" />
                                                    <div>
                                                        <div className="font-medium text-foreground">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="secondary">
                                                    {user.role.name}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant={user.active ? "success" : "default"}>
                                                    {user.active ? t("users.active") : t("users.inactive")}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(user)}
                                                        disabled={loading === user.id}
                                                    >
                                                        {user.active ? (
                                                            <UserX className="w-4 h-4" />
                                                        ) : (
                                                            <UserCheck className="w-4 h-4" />
                                                        )}
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
                <CreateUserDialog
                    roles={roles}
                    open={showCreateDialog}
                    onClose={handleUserCreated}
                />
            )}

            {editingUser && (
                <UpdateUserDialog
                    user={editingUser}
                    roles={roles}
                    open={!!editingUser}
                    onClose={handleUserUpdated}
                />
            )}
        </>
    );
}
