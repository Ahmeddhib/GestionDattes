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
        } catch {
            toast.error(t("messages.error.generic"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onClose}>
            <AlertDialogContent className="bg-card border-border rounded-lg">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-100 dark:bg-red-950/45">
                            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
                        </div>
                        <AlertDialogTitle className="text-xl font-bold text-foreground">
                            {t("roles.deleteDialog")}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="mt-4 rounded-sm border border-amber-400/70 bg-amber-50/80 p-4 text-muted-foreground dark:border-amber-700/60 dark:bg-amber-950/30">
                        <p className="mb-2 text-sm text-amber-900 dark:text-amber-200">
                            ⚠️ {t("roles.deleteWarning", { name: role.name })}
                        </p>
                        <p className="text-sm text-amber-900 dark:text-amber-200">
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
