"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/shared/Button";
import { createUserAction } from "@/actions/users/create-user.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateUserDialogProps {
    roles: Array<{ id: string; name: string }>;
    open: boolean;
    onClose: () => void;
}

export function CreateUserDialog({ roles, open, onClose }: CreateUserDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roleId: roles[0]?.id || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createUserAction(formData);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : "Erreur lors de la création");
            } else {
                toast.success("Utilisateur créé avec succès");
                // Réinitialiser le formulaire
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    roleId: roles[0]?.id || "",
                });
                // Fermer et rafraîchir
                onClose();
                router.refresh();
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
                        Créer un nouvel utilisateur
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
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="********"
                            required
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
                            {loading ? "Création..." : "Créer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
