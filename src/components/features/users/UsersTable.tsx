"use client";

import { useState, useEffect } from "react";
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
    const [data, setData] = useState(initialData);
    const [total, setTotal] = useState(initialTotal);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    // Synchroniser avec les props quand elles changent (après router.refresh())
    useEffect(() => {
        setData(initialData);
        setTotal(initialTotal);
    }, [initialData, initialTotal]);

    const pageSize = 10;
    const totalPages = Math.ceil(total / pageSize);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
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
                // Mettre à jour immédiatement le state local
                setData((prevData) =>
                    prevData.map((u) =>
                        u.id === user.id ? { ...u, active: !u.active } : u
                    )
                );
                toast.success(user.active ? t("users.deactivated") : t("users.activated"));
                // Refresh pour synchroniser avec le serveur
                router.refresh();
            }
        } catch (error) {
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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C1A00]">{t("users.title")}</h2>
                        <p className="text-gray-600 mt-1">{t("users.description")}</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateDialog(true)}
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
                <Card>
                    {data.length === 0 ? (
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
                                <thead>
                                    <tr className="border-b border-[#F0E0C0]">
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            {t("users.name")}
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            {t("users.role")}
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            {t("users.status")}
                                        </th>
                                        <th className="text-right py-3 px-4 font-semibold text-[#2C1A00]">
                                            {t("common.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-[#F0E0C0] last:border-0 hover:bg-sand/30 transition-colors"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={user.name} size="md" />
                                                    <div>
                                                        <div className="font-medium text-[#2C1A00]">
                                                            {user.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
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
