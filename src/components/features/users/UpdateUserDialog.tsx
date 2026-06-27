"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/shared/Button";
import { updateUserAction } from "@/actions/users/update-user.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    name: string;
    email: string;
    role: {
        id: string;
        name: string;
    };
}

interface UpdateUserDialogProps {
    user: User;
    roles: Array<{ id: string; name: string }>;
    open: boolean;
    onClose: () => void;
}

export function UpdateUserDialog({ user, roles, open, onClose }: UpdateUserDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        password: "",
        roleId: user.role.id,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Remove password if empty
            const dataToSend = formData.password
                ? formData
                : { name: formData.name, email: formData.email, roleId: formData.roleId };

            const result = await updateUserAction(user.id, dataToSend);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : "Erreur lors de la mise à jour");
            } else {
                toast.success("Utilisateur mis à jour avec succès");
                router.refresh();
                onClose();
            }
        } catch (error) {
            toast.error("Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-white border-[#F0E0C0]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#2C1A00]">
                        Modifier l'utilisateur
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ahmed Ben Salah"
                            required
                            className="rounded-[7px] border-[#F0E0C0]"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="ahmed@dattes.tn"
                            required
                            className="rounded-[7px] border-[#F0E0C0]"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Laisser vide pour ne pas changer"
                            minLength={6}
                            className="rounded-[7px] border-[#F0E0C0]"
                        />
                    </div>

                    <div>
                        <Label htmlFor="roleId">Rôle *</Label>
                        <Select
                            value={formData.roleId}
                            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                        >
                            <SelectTrigger className="rounded-[7px] border-[#F0E0C0]">
                                <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? "Mise à jour..." : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
