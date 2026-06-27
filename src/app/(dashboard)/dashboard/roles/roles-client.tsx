"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { createRoleAction } from "@/actions/roles/create-role.action";
import { updateRoleAction } from "@/actions/roles/update-role.action";
import { deleteRoleAction } from "@/actions/roles/delete-role.action";

import { MoreHorizontal, Edit, Trash, Search, ShieldPlus } from "lucide-react";

type Role = { id: string; name: string; description: string | null };

export default function RolesClient({ initialRoles }: { initialRoles: Role[] }) {
    const [roles, setRoles] = useState(initialRoles);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredRoles = useMemo(() => {
        return roles.filter(role => 
            role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [roles, searchQuery]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createRoleAction(formData);
        if (res.error) alert(res.error);
        else {
            setRoles([...roles, res.role as Role]);
            setIsCreateOpen(false);
            setFormData({ name: "", description: "" });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        const res = await updateRoleAction(selectedRole.id, formData);
        if (res.error) alert(res.error);
        else {
            setRoles(roles.map((r) => (r.id === selectedRole.id ? (res.role as Role) : r)));
            setIsEditOpen(false);
            setSelectedRole(null);
            setFormData({ name: "", description: "" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce rôle ?")) return;
        const res = await deleteRoleAction(id);
        if (res.error) alert(res.error);
        else {
            setRoles(roles.filter((r) => r.id !== id));
        }
    };

    const openEdit = (role: Role) => {
        setSelectedRole(role);
        setFormData({ name: role.name, description: role.description || "" });
        setIsEditOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredRoles.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredRoles.map(r => r.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const getRoleColor = (roleName: string) => {
        if (roleName.toUpperCase().includes('ADMIN')) return "bg-violet-100 text-violet-800 border-violet-200";
        if (roleName.toUpperCase().includes('LABORANTIN')) return "bg-blue-100 text-blue-800 border-blue-200";
        return "bg-slate-100 text-slate-800 border-slate-200";
    };

    return (
        <div className="flex-1 space-y-4 p-4 pt-0">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Rôles</h2>
                    <p className="text-sm text-muted-foreground">
                        Définissez les niveaux d'accès et les permissions de votre application.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-violet-600 hover:bg-violet-700">
                                <ShieldPlus className="mr-2 h-4 w-4" />
                                Nouveau Rôle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un rôle</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom du rôle</label>
                                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>
                                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Enregistrer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrer par nom ou description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <Checkbox 
                                    checked={filteredRoles.length > 0 && selectedIds.size === filteredRoles.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Sélectionner tout"
                                />
                            </TableHead>
                            <TableHead className="w-1/4">Nom du Rôle</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRoles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Aucun rôle trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRoles.map((role) => (
                                <TableRow 
                                    key={role.id} 
                                    className="group hover:bg-muted/50 transition-colors"
                                    data-state={selectedIds.has(role.id) ? "selected" : undefined}
                                >
                                    <TableCell className="text-center">
                                        <Checkbox 
                                            checked={selectedIds.has(role.id)}
                                            onCheckedChange={() => toggleSelect(role.id)}
                                            aria-label={`Sélectionner ${role.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Badge variant="outline" className={getRoleColor(role.name)}>
                                            {role.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {role.description || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => openEdit(role)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => handleDelete(role.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Statistics */}
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
                <div>
                    {selectedIds.size} sur {filteredRoles.length} ligne(s) sélectionnée(s).
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Modifier le rôle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom</label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Mettre à jour</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
