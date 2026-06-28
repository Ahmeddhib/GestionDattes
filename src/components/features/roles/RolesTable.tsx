"use client";

import { useState, useEffect } from "react";
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
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [total, setTotal] = useState(initialTotal);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);

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
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2C1A00]">Gestion des rôles</h2>
                        <p className="text-gray-600 mt-1">Gérez les rôles et permissions du système</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateDialog(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouveau rôle
                    </Button>
                </div>

                {/* Search */}
                <SearchBar
                    placeholder="Rechercher un rôle..."
                    onSearch={handleSearch}
                />

                {/* Table */}
                <Card>
                    {data.length === 0 ? (
                        <EmptyState
                            icon={<Shield className="w-12 h-12" />}
                            title="Aucun rôle trouvé"
                            description="Commencez par créer votre premier rôle"
                            action={
                                <Button
                                    variant="primary"
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Créer un rôle
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#F0E0C0]">
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            Nom
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            Description
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-[#2C1A00]">
                                            Utilisateurs
                                        </th>
                                        <th className="text-right py-3 px-4 font-semibold text-[#2C1A00]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((role) => (
                                        <tr
                                            key={role.id}
                                            className="border-b border-[#F0E0C0] last:border-0 hover:bg-sand/30 transition-colors"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-[8px] bg-dattes-100 flex items-center justify-center">
                                                        <Shield className="w-5 h-5 text-dattes-600" />
                                                    </div>
                                                    <span className="font-medium text-[#2C1A00]">
                                                        {role.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">
                                                {role.description || "—"}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="secondary">
                                                    {role._count.users} utilisateur{role._count.users > 1 ? "s" : ""}
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
