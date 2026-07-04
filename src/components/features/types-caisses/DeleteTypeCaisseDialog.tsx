"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteTypeCaisseAction } from "@/actions/types-caisses/delete-type-caisse.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type DeleteTypeCaisseDialogProps = {
    typeCaisse: {
        id: string;
        nom: string;
    };
};

export function DeleteTypeCaisseDialog({ typeCaisse }: DeleteTypeCaisseDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);

        const result = await deleteTypeCaisseAction(typeCaisse.id);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.deleted").replace("{entity}", t("typesCaisses.title")));
            setOpen(false);
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[7px] text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[14px] bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#3D1C00]">
                        {t("typesCaisses.deleteDialog")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#3D1C00]/60">
                        {t("typesCaisses.deleteWarning").replace("{name}", typeCaisse.nom)}
                        <br />
                        <br />
                        {t("typesCaisses.deleteIrreversible")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-[9px]" disabled={loading}>
                        {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="rounded-[9px] bg-red-600 hover:bg-red-700"
                    >
                        {loading ? t("typesCaisses.deleting") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
