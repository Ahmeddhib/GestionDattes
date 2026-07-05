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
import { deleteLivraisonAction } from "@/actions/livraisons/delete-livraison.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type DeleteLivraisonDialogProps = {
    livraison: {
        id: string;
        numeroLot: string;
    };
};

export function DeleteLivraisonDialog({ livraison }: DeleteLivraisonDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        const result = await deleteLivraisonAction(livraison.id);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.deleted").replace("{entity}", t("livraisons.title")));
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
                        {t("livraisons.deleteDialog")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#3D1C00]/60">
                        {t("livraisons.deleteWarning").replace("{numeroLot}", livraison.numeroLot)}
                        <br />
                        <br />
                        {t("livraisons.deleteIrreversible")}
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
                        {loading ? t("livraisons.deleting") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
