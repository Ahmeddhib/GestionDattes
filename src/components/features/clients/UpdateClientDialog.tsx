"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/validators/client.validator";
import { updateClientAction } from "@/actions/clients/update-client.action";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface UpdateClientDialogProps {
    client: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateClientDialog({ client, open, onOpenChange }: UpdateClientDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<CreateClientInput>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            nom: "",
            telephone: "",
            adresse: "",
            email: "",
        },
    });

    useEffect(() => {
        if (client && open) {
            form.reset({
                nom: client.nom,
                telephone: client.telephone || "",
                adresse: client.adresse || "",
                email: client.email || "",
            });
        }
    }, [client, open, form]);

    const onSubmit = async (data: CreateClientInput) => {
        if (!client) return;

        try {
            setIsLoading(true);

            const result = await updateClientAction(client.id, data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("clients.title") }));
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!client) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("clients.edit")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("clients.editDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.nom")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={t("clients.nomPlaceholder")}
                                            className="rounded-[7px]"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="telephone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.telephone")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ""}
                                            placeholder={t("clients.telephonePlaceholder")}
                                            className="rounded-[7px]"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.email")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ""}
                                            type="email"
                                            placeholder={t("clients.emailPlaceholder")}
                                            className="rounded-[7px]"
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="adresse"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.adresse")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            value={field.value || ""}
                                            placeholder={t("clients.adressePlaceholder")}
                                            className="rounded-[7px]"
                                            disabled={isLoading}
                                        />
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
                                className="rounded-[9px]"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
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
