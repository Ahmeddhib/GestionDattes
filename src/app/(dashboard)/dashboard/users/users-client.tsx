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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { createUserAction } from "@/actions/users/create-user.action";
import { updateUserAction } from "@/actions/users/update-user.action";
import { activateUserAction } from "@/actions/users/activate-user.action";
import { deactivateUserAction } from "@/actions/users/deactivate-user.action";
import { deleteUserAction } from "@/actions/users/delete-user.action";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Edit, UserCheck, UserX, Trash, Search, UserPlus } from "lucide-react";

type Role = { id: string; name: string };
type User = { id: string; name: string; email: string; active: boolean; roleId: string; role?: Role };

export default function UsersClient({ initialUsers, roles }: { initialUsers: User[]; roles: Role[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", roleId: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await createUserAction(formData);
        if (res.error || !res.user) alert(res.error || "Erreur de création");
        else {
            const newUser = { ...res.user, role: roles.find((r) => r.id === res.user!.roleId) };
            setUsers([...users, newUser as User]);
            setIsCreateOpen(false);
            setFormData({ name: "", email: "", password: "", roleId: "" });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const dataToUpdate = {
            name: formData.name,
            email: formData.email,
            roleId: formData.roleId,
            ...(formData.password ? { password: formData.password } : {}),
        };
        const res = await updateUserAction(selectedUser.id, dataToUpdate);
        if (res.error || !res.user) alert(res.error || "Erreur de modification");
        else {
            const updatedUser = { ...res.user, role: roles.find((r) => r.id === res.user!.roleId) };
            setUsers(users.map((u) => (u.id === selectedUser.id ? (updatedUser as User) : u)));
            setIsEditOpen(false);
            setSelectedUser(null);
            setFormData({ name: "", email: "", password: "", roleId: "" });
        }
    };

    const handleToggleActive = async (user: User) => {
        if (user.active) {
            const res = await deactivateUserAction(user.id);
            if (res.error) alert(res.error);
            else setUsers(users.map((u) => (u.id === user.id ? { ...u, active: false } : u)));
        } else {
            const res = await activateUserAction(user.id);
            if (res.error) alert(res.error);
            else setUsers(users.map((u) => (u.id === user.id ? { ...u, active: true } : u)));
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur ${user.name} ?`)) return;
        const res = await deleteUserAction(user.id);
        if (res.error) alert(res.error);
        else setUsers(users.filter((u) => u.id !== user.id));
    };

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: "", roleId: user.roleId });
        setIsEditOpen(true);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredUsers.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredUsers.map(u => u.id)));
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
                    <h2 className="text-2xl font-bold tracking-tight">Utilisateurs</h2>
                    <p className="text-sm text-muted-foreground">
                        Gérez les accès, les rôles et les profils de votre équipe.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-violet-600 hover:bg-violet-700">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Nouvel Utilisateur
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Ajouter un utilisateur</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom</label>
                                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mot de passe</label>
                                    <Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rôle</label>
                                    <Select value={formData.roleId} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un rôle" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={!formData.roleId}>Enregistrer</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex items-center py-4">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrer par nom ou email..."
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
                                    checked={filteredUsers.length > 0 && selectedIds.size === filteredUsers.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Sélectionner tout"
                                />
                            </TableHead>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Aucun utilisateur trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow 
                                    key={user.id} 
                                    className="group hover:bg-muted/50 transition-colors"
                                    data-state={selectedIds.has(user.id) ? "selected" : undefined}
                                >
                                    <TableCell className="text-center">
                                        <Checkbox 
                                            checked={selectedIds.has(user.id)}
                                            onCheckedChange={() => toggleSelect(user.id)}
                                            aria-label={`Sélectionner ${user.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.name}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getRoleColor(user.role?.name || "")}>
                                            {user.role?.name || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium">
                                                {user.active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
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
                                                <DropdownMenuItem onClick={() => openEdit(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                                    {user.active ? (
                                                        <>
                                                            <UserX className="mr-2 h-4 w-4 text-orange-500" />
                                                            Désactiver
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                                                            Activer
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    onClick={() => handleDelete(user)}
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
                    {selectedIds.size} sur {filteredUsers.length} ligne(s) sélectionnée(s).
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom</label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nouveau mot de passe</label>
                            <Input type="password" placeholder="Laisser vide pour ne pas changer" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rôle</label>
                            <Select value={formData.roleId} onValueChange={(val) => setFormData({ ...formData, roleId: val })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Mettre à jour</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
