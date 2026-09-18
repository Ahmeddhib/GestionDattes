"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
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
import { cancelLivraisonAction } from "@/actions/livraisons/delete-livraison.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type DeleteLivraisonDialogProps = {
    livraison: {
        id: string;
        numeroLot: string;
        statut?: "VALIDEE" | "ANNULEE";
    };
};

export function DeleteLivraisonDialog({ livraison }: DeleteLivraisonDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [motif, setMotif] = useState("");
    const motifValide = motif.trim().length >= 3;

    function handleOpenChange(nextOpen: boolean) {
        if (loading) return;
        setOpen(nextOpen);
        if (!nextOpen) setMotif("");
    }

    async function handleDelete() {
        if (!motifValide) {
            toast.error(t("livraisons.cancellation.reasonRequired"));
            return;
        }
        setLoading(true);
        const result = await cancelLivraisonAction(livraison.id, motif);
        setLoading(false);

        if (result.success) {
            toast.success(t("livraisons.cancellation.success"));
            setOpen(false);
            setMotif("");
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={livraison.statut === "ANNULEE"}
                    title={t("livraisons.cancellation.action")}
                    className="h-8 w-8 rounded-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                >
                    <Ban className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100dvw-1rem)] gap-4 overflow-x-hidden rounded-xl bg-card p-4 data-[size=default]:max-w-[calc(100dvw-1rem)] sm:w-full sm:gap-5 sm:p-6 sm:data-[size=default]:max-w-lg">
                <AlertDialogHeader className="min-w-0 text-start sm:group-data-[size=default]/alert-dialog-content:place-items-stretch">
                    <AlertDialogTitle className="break-words pe-7 text-base font-semibold leading-snug text-foreground sm:text-lg">
                        {t("livraisons.cancellation.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="break-words text-start text-sm leading-relaxed text-muted-foreground">
                        {t("livraisons.cancellation.warning").replace("{numeroLot}", livraison.numeroLot)}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="w-full min-w-0 space-y-2 text-start">
                    <Label htmlFor={`motif-annulation-${livraison.id}`} className="flex flex-wrap items-center gap-1 text-sm font-semibold text-foreground">
                        {t("livraisons.cancellation.reasonLabel")} <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                        id={`motif-annulation-${livraison.id}`}
                        value={motif}
                        onChange={(event) => setMotif(event.target.value)}
                        placeholder={t("livraisons.cancellation.reasonPlaceholder")}
                        className="box-border max-h-[40dvh] min-h-28 w-full min-w-0 resize-y rounded-md border-border bg-background px-3 py-3 leading-relaxed focus-visible:border-[#C17A2B] focus-visible:ring-2 focus-visible:ring-[#C17A2B]/25 focus-visible:ring-offset-0 sm:min-h-32"
                        aria-required="true"
                        disabled={loading}
                    />
                    <p className="break-words text-xs leading-relaxed text-muted-foreground">
                        {t("livraisons.cancellation.reasonHint")}
                    </p>
                </div>
                <AlertDialogFooter className="-mx-4 -mb-4 gap-2 p-4 sm:-mx-6 sm:-mb-6 sm:p-5">
                    <AlertDialogCancel className="w-full rounded-md sm:w-auto sm:min-w-28" disabled={loading}>
                        {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading || !motifValide}
                        className="w-full rounded-md bg-red-600 px-4 hover:bg-red-700 sm:w-auto sm:min-w-48"
                    >
                        {loading ? t("livraisons.cancellation.loading") : t("livraisons.cancellation.confirm")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
