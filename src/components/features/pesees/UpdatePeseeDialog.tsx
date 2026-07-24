"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildUpdatePeseeSchema, type UpdatePeseeInput } from "@/validators/pesee.validator";
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
import { Loader2, Scale, Plus, Trash2 } from "lucide-react";

interface UpdatePeseeDialogProps {
    pesee: Pesee | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdatePeseeDialog({ pesee, open, onOpenChange }: UpdatePeseeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();
    const tareRef = useRef(pesee?.tareKg ?? 0);

    type FormValues = Omit<UpdatePeseeInput, "id">;

    const form = useForm<FormValues>({
        resolver: async (values, context, options) => {
            const merged = { ...values, id: pesee?.id ?? "" } as unknown as FormValues;
            const resolver = zodResolver(buildUpdatePeseeSchema(tareRef.current)) as unknown as Resolver<FormValues>;
            return resolver(merged, context, options);
        },
        defaultValues: {
            caisses: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "caisses",
    });

    const caisses = form.watch("caisses");
    const tare = pesee?.tareKg ?? 0;

    const totals = useMemo(() => {
        const poids = (caisses ?? []).map((c) => Number(c?.poidsBrut) || 0);
        const nombreCaisses = poids.length;
        const poidsBrutTotal = poids.reduce((sum, p) => sum + p, 0);
        const poidsTareTotal = tare * nombreCaisses;
        const poidsNetTotal = poidsBrutTotal - poidsTareTotal;
        return {
            nombreCaisses,
            poidsBrutTotal,
            poidsTareTotal,
            poidsNetTotal,
            poidsBrutMoyen: nombreCaisses > 0 ? poidsBrutTotal / nombreCaisses : 0,
            poidsNetMoyen: nombreCaisses > 0 ? poidsNetTotal / nombreCaisses : 0,
        };
    }, [caisses, tare]);

    useEffect(() => {
        if (pesee) {
            tareRef.current = pesee.tareKg;
            form.reset({
                caisses: pesee.caisses?.length
                    ? [...pesee.caisses]
                          .sort((a, b) => a.ordre - b.ordre)
                          .map((c) => ({ poidsBrut: c.poidsBrut }))
                    : [{ poidsBrut: 0 }],
            });
        }
    }, [pesee, form]);

    if (!pesee) return null;

    const onSubmit = async (data: Omit<UpdatePeseeInput, "id">) => {
        try {
            setIsLoading(true);

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
            <DialogContent className="sm:max-w-[600px] bg-white rounded-[14px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {t("pesees.update")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("pesees.updateDescription")} - <strong>{pesee.livraison.numeroLot}</strong> ({pesee.typeCaisse?.nom} / {pesee.typeDate?.nom})
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
                                        {pesee.livraison.numeroLot}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">{t("pesees.agriculteur")}:</span>
                                    <p className="font-medium text-[#3D1C00]">
                                        {pesee.livraison.Agriculteur.nom} {pesee.livraison.Agriculteur.prenom}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">{t("pesees.typeCaisse")}:</span>
                                    <p className="font-medium text-[#3D1C00]">{pesee.typeCaisse?.nom}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">{t("pesees.typeDate")}:</span>
                                    <p className="font-medium text-[#3D1C00]">{pesee.typeDate?.nom}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">{t("pesees.tare")}:</span>
                                    <p className="font-medium text-[#3D1C00]">{tare.toFixed(2)} kg</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {fields.map((caisseField, index) => (
                                <div key={caisseField.id} className="flex items-start gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`caisses.${index}.poidsBrut`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel className="text-xs text-gray-600">
                                                    {t("pesees.caisseLabel", { n: String(index + 1) })}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        placeholder={t("pesees.grossWeightLabel")}
                                                        className="rounded-[7px]"
                                                        disabled={isLoading}
                                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-600 text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        disabled={isLoading || fields.length <= 1}
                                        className="h-9 w-9 p-0 mt-6 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ poidsBrut: 0 })}
                            disabled={isLoading}
                            className="w-full rounded-[9px] border-[#C17A2B] text-[#C17A2B]"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("pesees.addCaisse")}
                        </Button>

                        <div className="rounded-[7px] bg-[#FAF0DC] border border-[#C17A2B] p-4 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-[#3D1C00]/70">{t("pesees.nombreCaisses")}:</span>{" "}
                                    <span className="font-medium text-[#3D1C00]">{totals.nombreCaisses}</span>
                                </div>
                                <div>
                                    <span className="text-[#3D1C00]/70">{t("pesees.poidsBrutTotal")}:</span>{" "}
                                    <span className="font-medium text-[#3D1C00]">{totals.poidsBrutTotal.toFixed(2)} kg</span>
                                </div>
                                <div>
                                    <span className="text-[#3D1C00]/70">{t("pesees.poidsTareTotal")}:</span>{" "}
                                    <span className="font-medium text-[#3D1C00]">{totals.poidsTareTotal.toFixed(2)} kg</span>
                                </div>
                                <div>
                                    <span className="text-[#3D1C00]/70">{t("pesees.poidsBrutMoyen")}:</span>{" "}
                                    <span className="font-medium text-[#3D1C00]">{totals.poidsBrutMoyen.toFixed(2)} kg</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-[#C17A2B]/30">
                                <span className="text-sm font-medium text-[#3D1C00]">
                                    {t("pesees.poidsNetTotal")} :
                                </span>
                                <span className="text-2xl font-bold text-[#C17A2B]">
                                    {totals.poidsNetTotal.toFixed(2)} kg
                                </span>
                            </div>
                            {totals.poidsNetTotal <= 0 && totals.poidsBrutTotal > 0 && (
                                <p className="text-xs text-red-600">
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
                                disabled={isLoading || fields.length === 0 || totals.poidsNetTotal <= 0}
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
