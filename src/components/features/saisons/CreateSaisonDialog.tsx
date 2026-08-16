"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { createSaisonAction } from "@/actions/saisons/create-saison.action";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
        ouverte: z.boolean(),
    })
    .refine((data) => new Date(data.dateFin) > new Date(data.dateDebut), {
        message: "La date de fin doit être après la date de début",
        path: ["dateFin"],
    });

type FormData = z.infer<typeof formSchema>;

export function CreateSaisonDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { nom: "", dateDebut: "", dateFin: "", ouverte: false },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);

            const result = await createSaisonAction({
                nom: data.nom,
                dateDebut: data.dateDebut,
                dateFin: data.dateFin,
                statut: data.ouverte ? "OUVERTE" : "CLOTUREE",
            });

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.created", { entity: t("finance.saisons.title") }));
            form.reset();
            setOpen(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-md">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("finance.saisons.nouvelleSaison")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125 bg-white rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("finance.saisons.nouvelleSaison")}
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
                                        <Input
                                            {...field}
                                            placeholder="Saison 2025-2026"
                                            className="rounded-sm"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            name="ouverte"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(!!checked)}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0">{t("finance.saisons.creerOuverte")}</FormLabel>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
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
                                {t("common.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
