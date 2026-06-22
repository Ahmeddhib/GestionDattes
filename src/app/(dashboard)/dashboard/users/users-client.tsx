"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createUserAction } from "@/actions/users/create-user.action";
import { updateUserAction } from "@/actions/users/update-user.action";
import { activateUserAction } from "@/actions/users/activate-user.action";
import { deactivateUserAction } from "@/actions/users/deactivate-user.action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = { id: string; name: string };
type User = { id: string; name: string; email: string; active: boolean; roleId: string; role?: Role };

export default function UsersClient({ initialUsers, roles }: { initialUsers: User[]; roles: Role[] }) {
    const [users, setUsers] = useState(initialUsers);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ name: "", email: "", password: "", roleId: "" });

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

    const openEdit = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: "", roleId: user.roleId });
        setIsEditOpen(true);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Nouvel Utilisateur</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter un utilisateur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nom</label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Mot de passe</label>
                                <Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Rôle</label>
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
                            <Button type="submit" className="w-full" disabled={!formData.roleId}>Enregistrer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role?.name || "N/A"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.active ? "Actif" : "Inactif"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant={user.active ? "secondary" : "default"} size="sm" onClick={() => handleToggleActive(user)}>
                                        {user.active ? "Désactiver" : "Activer"}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => openEdit(user)}>Modifier</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nom</label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Nouveau mot de passe (optionnel)</label>
                            <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Rôle</label>
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
                        <Button type="submit" className="w-full">Mettre à jour</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
