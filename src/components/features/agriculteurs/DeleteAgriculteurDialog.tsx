"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAgriculteurAction } from "@/actions/agriculteurs/delete-agriculteur.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Agriculteur = {
    id: string;
    code: string;
    nom: string;
    prenom: string;
    _count?: {
        livraisons: number;
        pretCaisses: number;
    };
};

interface DeleteAgriculteurDialogProps {
    agriculteur: Agriculteur;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteAgriculteurDialog({
    agriculteur,
    open,
    onOpenChange,
}: DeleteAgriculteurDialogProps) {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const hasLivraisons = (agriculteur._count?.livraisons || 0) > 0;
    const hasPretCaisses = (agriculteur._count?.pretCaisses || 0) > 0;
    const canDelete = !hasLivraisons && !hasPretCaisses;

    const handleDelete = async () => {
        if (!canDelete) return;

        try {
            setIsLoading(true);

            const result = await deleteAgriculteurAction(agriculteur.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.deleted", { entity: t("agriculteurs.title") }));
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
            <DialogContent className="sm:max-w-[500px] bg-white border-[#F0E0C0] rounded-[14px]">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-red-100 p-3">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-[#3D1C00]">
                                {t("agriculteurs.deleteDialog")}
                            </DialogTitle>
                            <DialogDescription className="text-[#3D1C00]/60 mt-2">
                                {t("agriculteurs.deleteWarning", { name: `${agriculteur.nom} ${agriculteur.prenom}` })} ({agriculteur.code})
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!canDelete && (
                    <div className="rounded-[7px] bg-white border border-red-200 p-4">
                        <p className="text-sm text-red-800 font-medium mb-2">
                            ❌ {t("messages.error.cannotDelete", { entity: t("agriculteurs.title") })}
                        </p>
                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                            {hasLivraisons && (
                                <li>• {agriculteur._count?.livraisons} livraison(s)</li>
                            )}
                            {hasPretCaisses && (
                                <li>• {agriculteur._count?.pretCaisses} prêt(s) de caisses</li>
                            )}
                        </ul>
                    </div>
                )}

                {canDelete && (
                    <div className="rounded-[7px] bg-white border border-amber-500 p-4">
                        <p className="text-sm text-amber-800">
                            ⚠️ {t("agriculteurs.deleteIrreversible")}
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="rounded-[9px] border-[#F0E0C0]"
                    >
                        {t("common.cancel")}
                    </Button>
                    {canDelete && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="rounded-[9px] bg-red-600 hover:bg-red-700"
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
