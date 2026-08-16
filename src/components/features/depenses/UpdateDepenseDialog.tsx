"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { updateDepenseAction } from "@/actions/depenses/update-depense.action";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
    libelle: z.string().min(2, "Le libellé doit contenir au moins 2 caractères"),
    montant: z.string().min(1, "Le montant est requis"),
    categorie: z.string().optional(),
    dateDepense: z.string().min(1, "La date est requise"),
    observations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface UpdateDepenseDialogProps {
    depense: Depense | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateDepenseDialog({ depense, open, onOpenChange }: UpdateDepenseDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { libelle: "", montant: "", categorie: "", dateDepense: "", observations: "" },
    });

    useEffect(() => {
        if (depense && open) {
            form.reset({
                libelle: depense.libelle,
                montant: depense.montant.toString(),
                categorie: depense.categorie || "",
                dateDepense: format(new Date(depense.dateDepense), "yyyy-MM-dd"),
                observations: depense.observations || "",
            });
        }
    }, [depense, open, form]);

    const onSubmit = async (data: FormData) => {
        if (!depense) return;

        try {
            setIsLoading(true);

            const result = await updateDepenseAction(depense.id, {
                libelle: data.libelle,
                montant: data.montant,
                categorie: data.categorie || undefined,
                dateDepense: data.dateDepense,
                observations: data.observations || undefined,
            });

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("finance.depenses.title") }));
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!depense) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125 bg-white rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("finance.depenses.modifierDepense")}
                    </DialogTitle>
                    <DialogDescription>{t("finance.depenses.description")}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="libelle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("finance.depenses.libelle")} *</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="rounded-sm" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="montant"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("finance.depenses.montant")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="rounded-sm"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dateDepense"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("finance.saisons.dateDebut")} *</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="date" className="rounded-sm" disabled={isLoading} />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="categorie"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("finance.depenses.categorie")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="rounded-sm" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("bonAchat.observations")}</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="rounded-sm" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                                className="rounded-md"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-md"
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
