"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { deleteSaisonAction } from "@/actions/saisons/delete-saison.action";
import { toast } from "sonner";
import type { Saison } from "./columns";

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

interface DeleteSaisonDialogProps {
    saison: Saison | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteSaisonDialog({ saison, open, onOpenChange }: DeleteSaisonDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    if (!saison) return null;

    const hasVentes = (saison._count?.Vente || 0) > 0;
    const canDelete = !hasVentes;

    const handleDelete = async () => {
        if (!canDelete) return;

        try {
            setIsLoading(true);

            const result = await deleteSaisonAction(saison.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.deleted", { entity: t("finance.saisons.title") }));
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
                            <DialogTitle className="text-[#3D1C00]">
                                {t("common.delete")}
                            </DialogTitle>
                            <DialogDescription className="text-[#3D1C00]/60 mt-2">
                                {t("finance.saisons.deleteConfirm")} <strong>{saison.nom}</strong> ?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!canDelete && (
                    <div className="rounded-sm bg-white border border-red-200 p-4">
                        <p className="text-sm text-red-800 font-medium">
                            {t("finance.saisons.cannotDelete")} ({saison._count!.Vente})
                        </p>
                    </div>
                )}

                {canDelete && (
                    <div className="rounded-sm bg-white border border-amber-500 p-4">
                        <p className="text-sm text-amber-800">{t("common.actionIrreversible")}</p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="rounded-md border-[#F0E0C0]"
                    >
                        {canDelete ? t("common.cancel") : t("common.close")}
                    </Button>
                    {canDelete && (
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
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
