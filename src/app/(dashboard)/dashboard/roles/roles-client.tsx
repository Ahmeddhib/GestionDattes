"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createRoleAction } from "@/actions/roles/create-role.action";
import { updateRoleAction } from "@/actions/roles/update-role.action";
import { deleteRoleAction } from "@/actions/roles/delete-role.action";

type Role = { id: string; name: string; description: string | null };

export default function RolesClient({ initialRoles }: { initialRoles: Role[] }) {
    const [roles, setRoles] = useState(initialRoles);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });

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

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestion des Rôles</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Nouveau Rôle</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter un rôle</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Nom</label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <Button type="submit" className="w-full">Enregistrer</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>{role.description}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => openEdit(role)}>Modifier</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(role.id)}>Supprimer</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le rôle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Nom</label>
                            <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <Button type="submit" className="w-full">Mettre à jour</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
