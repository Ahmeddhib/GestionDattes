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
import { updateSaisonAction } from "@/actions/saisons/update-saison.action";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z
    .object({
        nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        dateDebut: z.string().min(1, "La date de début est requise"),
        dateFin: z.string().min(1, "La date de fin est requise"),
        active: z.boolean(),
    })
    .refine((data) => new Date(data.dateFin) > new Date(data.dateDebut), {
        message: "La date de fin doit être après la date de début",
        path: ["dateFin"],
    });

type FormData = z.infer<typeof formSchema>;

interface UpdateSaisonDialogProps {
    saison: Saison | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateSaisonDialog({ saison, open, onOpenChange }: UpdateSaisonDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { nom: "", dateDebut: "", dateFin: "", active: true },
    });

    useEffect(() => {
        if (saison && open) {
            form.reset({
                nom: saison.nom,
                dateDebut: format(new Date(saison.dateDebut), "yyyy-MM-dd"),
                dateFin: format(new Date(saison.dateFin), "yyyy-MM-dd"),
                active: saison.active,
            });
        }
    }, [saison, open, form]);

    const onSubmit = async (data: FormData) => {
        if (!saison) return;

        try {
            setIsLoading(true);

            const result = await updateSaisonAction(saison.id, data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("finance.saisons.title") }));
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!saison) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125 bg-white rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("finance.saisons.modifierSaison")}
                    </DialogTitle>
                    <DialogDescription>{t("finance.saisons.description")}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("finance.saisons.nom")} *</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="rounded-sm" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dateDebut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("finance.saisons.dateDebut")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="date"
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
                                name="dateFin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("finance.saisons.dateFin")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="date"
                                                className="rounded-sm"
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(!!checked)}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0">{t("finance.saisons.active")}</FormLabel>
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
