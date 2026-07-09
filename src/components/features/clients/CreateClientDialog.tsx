"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/validators/client.validator";
import { createClientAction } from "@/actions/clients/create-client.action";
import { toast } from "sonner";

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
import { Plus, Loader2 } from "lucide-react";

export function CreateClientDialog() {
    const [open, setOpen] = useState(false);
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

    const onSubmit = async (data: CreateClientInput) => {
        try {
            setIsLoading(true);

            const result = await createClientAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.created", { entity: t("clients.title") }));
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
                <Button className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("clients.addNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("clients.addNew")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("clients.addNewDescription")}
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
                                onClick={() => setOpen(false)}
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
                                {t("common.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
