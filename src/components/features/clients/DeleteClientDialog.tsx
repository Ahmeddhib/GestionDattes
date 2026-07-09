"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { deleteClientAction } from "@/actions/clients/delete-client.action";
import { toast } from "sonner";
import type { Client } from "./columns";

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

interface DeleteClientDialogProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteClientDialog({ client, open, onOpenChange }: DeleteClientDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    if (!client) return null;

    const hasVentes = (client._count?.Vente || 0) > 0;
    const canDelete = !hasVentes;

    const handleDelete = async () => {
        if (!canDelete) return;

        try {
            setIsLoading(true);

            const result = await deleteClientAction(client.id);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.deleted", { entity: t("clients.title") }));
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
                                {t("clients.delete")}
                            </DialogTitle>
                            <DialogDescription className="text-[#3D1C00]/60 mt-2">
                                {t("clients.deleteConfirm")} <strong>{client.nom}</strong> ?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {!canDelete && (
                    <div className="rounded-[7px] bg-white border border-red-200 p-4">
                        <p className="text-sm text-red-800 font-medium mb-2">
                            ❌ {t("clients.cannotDelete")}
                        </p>
                        <p className="text-sm text-red-700">
                            • {t("clients.hasVentes", { count: String(client._count!.Vente) })}
                        </p>
                    </div>
                )}

                {canDelete && (
                    <div className="rounded-[7px] bg-white border border-amber-500 p-4">
                        <p className="text-sm text-amber-800">
                            ⚠️ {t("common.actionIrreversible")}
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
                        {canDelete ? t("common.cancel") : t("common.close")}
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
