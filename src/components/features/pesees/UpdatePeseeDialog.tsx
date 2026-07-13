"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePeseeSchema, type UpdatePeseeInput } from "@/validators/pesee.validator";
import { updatePeseeAction } from "@/actions/pesees/update-pesee.action";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Scale } from "lucide-react";

interface UpdatePeseeDialogProps {
    pesee: Pesee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdatePeseeDialog({ pesee, open, onOpenChange }: UpdatePeseeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<{ poidsBrut: number; tare: number | null | undefined }>({
        defaultValues: {
            poidsBrut: 0,
            tare: 0,
        },
    });

    const poidsBrut = form.watch("poidsBrut");
    const tare = form.watch("tare");
    const poidsNet = poidsBrut - (tare || 0);

    // Pré-remplir le formulaire quand pesee change
    useEffect(() => {
        if (pesee) {
            form.reset({
                poidsBrut: pesee.poidsBrut,
                tare: pesee.tare || 0,
            });
        }
    }, [pesee, form]);

    if (!pesee) return null;

    const onSubmit = async (data: { poidsBrut: number; tare: number | null | undefined }) => {
        try {
            setIsLoading(true);

            // Validation manuelle
            if (!data.poidsBrut || data.poidsBrut <= 0) {
                toast.error(t("validation.positive"));
                return;
            }

            const tare = data.tare ?? 0;
            const poidsNet = data.poidsBrut - tare;

            if (poidsNet <= 0) {
                toast.error(t("pesees.poidsNetMustBePositive"));
                return;
            }

            const result = await updatePeseeAction(pesee.id, data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("pesees.title") }));
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
            <DialogContent className="sm:max-w-[550px] bg-white rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {t("pesees.update")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("pesees.updateDescription")} - <strong>{pesee.Livraison.numeroLot}</strong>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Info livraison (lecture seule) */}
                        <div className="rounded-[7px] bg-gray-50 border border-gray-200 p-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">{t("pesees.numeroLot")}:</span>
                                    <p className="font-medium text-[#3D1C00]">
                                        {pesee.Livraison.numeroLot}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">{t("pesees.agriculteur")}:</span>
                                    <p className="font-medium text-[#3D1C00]">
                                        {pesee.Livraison.Agriculteur.nom} {pesee.Livraison.Agriculteur.prenom}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="poidsBrut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("pesees.poidsBrut")} (kg) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                placeholder="500.00"
                                                className="rounded-[7px]"
                                                disabled={isLoading}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tare"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("pesees.tare")} (kg)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                placeholder="50.00"
                                                className="rounded-[7px]"
                                                disabled={isLoading}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Affichage du poids net calculé */}
                        <div className="rounded-[7px] bg-[#FAF0DC] border border-[#C17A2B] p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#3D1C00]">
                                    {t("pesees.poidsNet")} :
                                </span>
                                <span className="text-2xl font-bold text-[#C17A2B]">
                                    {poidsNet.toFixed(2)} kg
                                </span>
                            </div>
                            {poidsNet <= 0 && poidsBrut > 0 && (
                                <p className="text-xs text-red-600 mt-2">
                                    ⚠️ {t("pesees.poidsNetMustBePositive")}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="rounded-[9px]"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || poidsNet <= 0}
                                className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("common.update")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
