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
import { useClientTranslations } from "@/hooks/useClientTranslations";

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
    const { t } = useClientTranslations();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);

        try {
            const result = await deleteRoleAction(role.id);

            if (result.error) {
                toast.error(typeof result.error === "string" ? result.error : t("messages.error.generic"));
            } else {
                toast.success(t("messages.success.deleted", { entity: t("roles.title") }));
                router.refresh();
                onClose();
            }
        } catch (error) {
            toast.error(t("messages.error.generic"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="bg-white border-[#F0E0C0] rounded-[14px]">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-[9px] bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-[#2C1A00]">
                            {t("roles.deleteDialog")}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-600 bg-white border border-amber-500 rounded-[7px] p-4 mt-4">
                        <p className="text-sm text-amber-800 mb-2">
                            ⚠️ {t("roles.deleteWarning", { name: role.name })}
                        </p>
                        <p className="text-sm text-amber-800">
                            {t("roles.deleteIrreversible")}
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button variant="outline" disabled={loading}>
                            {t("common.cancel")}
                        </Button>
                    </AlertDialogCancel>
                    <Button
                        variant="primary"
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {loading ? t("roles.deleting") : t("common.delete")}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
