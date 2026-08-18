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

const formSchema = z
    .object({
        nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        dateDebut: z.string().min(1, "La date de début est requise"),
        dateFin: z.string().min(1, "La date de fin est requise"),
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
        defaultValues: { nom: "", dateDebut: "", dateFin: "" },
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);

            const result = await createSaisonAction({
                nom: data.nom,
                dateDebut: data.dateDebut,
                dateFin: data.dateFin,
                // Toujours OUVERTE : créer une saison, c'est démarrer une
                // campagne. Le service refuse proprement s'il en existe déjà une
                // ouverte (contrainte `Saison_one_open_per_tenant`).
                statut: "OUVERTE" as const,
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
            <DialogContent className="sm:max-w-125 bg-card rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
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

                        {/* La case « créer ouverte » a été retirée : une saison
                            que l'on crée est une campagne qui démarre, jamais une
                            campagne déjà close. Elle permettait de créer une
                            saison CLOTUREE d'emblée — une saison morte à la
                            naissance, dans laquelle aucune opération ne peut être
                            saisie. Le statut est désormais toujours OUVERTE. */}

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
