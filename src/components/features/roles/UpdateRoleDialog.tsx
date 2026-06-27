"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/shared/Button";
import { updateRoleAction } from "@/actions/roles/update-role.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface UpdateRoleDialogProps {
    role: Role;
    open: boolean;
    onClose: () => void;
}

export function UpdateRoleDialog({ role, open, onClose }: UpdateRoleDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: role.name,
        description: role.description || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateRoleAction(role.id, formData);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : "Erreur lors de la mise à jour");
            } else {
                toast.success("Rôle mis à jour avec succès");
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
                        Modifier le rôle
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nom du rôle *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: GESTIONNAIRE"
                            required
                            className="rounded-[7px] border-[#F0E0C0]"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description du rôle"
                            className="rounded-[7px] border-[#F0E0C0]"
                        />
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
