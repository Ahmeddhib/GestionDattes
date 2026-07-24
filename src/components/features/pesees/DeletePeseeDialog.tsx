"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { deletePeseeAction } from "@/actions/pesees/delete-pesee.action";
import { toast } from "sonner";
import type { Pesee } from "./columns";

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

interface DeletePeseeDialogProps {
    pesee: Pesee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeletePeseeDialog({ pesee, open, onOpenChange }: DeletePeseeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    if (!pesee) return null;

    const handleDelete = async () => {
        try {
            setIsLoading(true);

            const result = await deletePeseeAction(pesee.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.deleted", { entity: t("pesees.title") }));
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
                                {t("pesees.delete")}
                            </DialogTitle>
                            <DialogDescription className="text-[#3D1C00]/60 mt-2">
                                {t("pesees.deleteConfirm")} <strong>{pesee.livraison.numeroLot}</strong> ({pesee.typeCaisse?.nom}) ?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Info de la pesée */}
                    <div className="rounded-[7px] bg-gray-50 border border-gray-200 p-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-600">{t("pesees.agriculteur")}:</span>
                                <p className="font-medium text-[#3D1C00]">
                                    {pesee.livraison.Agriculteur.nom} {pesee.livraison.Agriculteur.prenom}
                                </p>
                            </div>
                            <div>
                                <span className="text-gray-600">{t("pesees.poidsNetTotal")}:</span>
                                <p className="font-medium text-[#C17A2B]">
                                    {pesee.poidsNetTotal.toFixed(2)} kg
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Avertissement */}
                    <div className="rounded-[7px] bg-white border border-amber-500 p-4">
                        <p className="text-sm text-amber-800">
                            ⚠️ {t("common.actionIrreversible")}
                        </p>
                    </div>
                </div>

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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
