"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { deleteDepenseAction } from "@/actions/depenses/delete-depense.action";
import { toast } from "sonner";
import type { Depense } from "./columns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteDepenseDialogProps {
    depense: Depense | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteDepenseDialog({ depense, open, onOpenChange }: DeleteDepenseDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    if (!depense) return null;

    const handleDelete = async () => {
        try {
            setIsLoading(true);

            const result = await deleteDepenseAction(depense.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.deleted", { entity: t("finance.depenses.title") }));
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125 bg-white border-[#F0E0C0] rounded-lg">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-[#3D1C00]">{t("common.delete")}</DialogTitle>
                            <DialogDescription className="text-[#3D1C00]/60 mt-2">
                                {t("finance.depenses.deleteConfirm")} <strong>{depense.libelle}</strong> ?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="rounded-sm bg-white border border-amber-500 p-4">
                    <p className="text-sm text-amber-800">{t("common.actionIrreversible")}</p>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="rounded-md border-[#F0E0C0]"
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="rounded-md bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.loading")}
                            </>
                        ) : (
                            t("common.delete")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
