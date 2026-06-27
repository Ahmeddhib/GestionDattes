"use client";

import { useState } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/shared/Button";
import { deleteRoleAction } from "@/actions/roles/delete-role.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

interface Role {
    id: string;
    name: string;
}

interface DeleteRoleDialogProps {
    role: Role;
    open: boolean;
    onClose: () => void;
}

export function DeleteRoleDialog({ role, open, onClose }: DeleteRoleDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);

        try {
            const result = await deleteRoleAction(role.id);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : "Erreur lors de la suppression");
            } else {
                toast.success("Rôle supprimé avec succès");
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
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="bg-white border-[#F0E0C0]">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-[9px] bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-[#2C1A00]">
                            Supprimer le rôle
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-600">
                        Êtes-vous sûr de vouloir supprimer le rôle <strong>{role.name}</strong> ?
                        Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" disabled={loading}>
                            Annuler
                        </Button>
                    </AlertDialogCancel>
                    <Button
                        variant="primary"
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? "Suppression..." : "Supprimer"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
