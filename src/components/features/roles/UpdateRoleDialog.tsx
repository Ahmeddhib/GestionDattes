"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateRoleAction } from "@/actions/roles/update-role.action";
import { updateRoleValidator, type UpdateRoleInput } from "@/validators/role.validator";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface UpdateRoleDialogProps {
    role: Role;
    open: boolean;
    onClose: () => void;
}

export function UpdateRoleDialog({ role, open, onClose }: UpdateRoleDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UpdateRoleInput>({
        resolver: zodResolver(updateRoleValidator),
        defaultValues: {
            name: role.name,
            description: role.description || "",
        },
    });

    useEffect(() => {
        form.reset({
            name: role.name,
            description: role.description || "",
        });
    }, [role, form]);

    const onSubmit = async (data: UpdateRoleInput) => {
        try {
            setIsLoading(true);

            const result = await updateRoleAction(role.id, data);

            if ("error" in result) {
                const errorMessage = typeof result.error === "string"
                    ? result.error
                    : t("messages.error.generic");
                toast.error(errorMessage);
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("roles.title") }));
            onClose();
            router.refresh();
        } catch (error) {
            console.error("Erreur:", error);
            toast.error(t("messages.error.generic"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white border-[#F0E0C0] rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">{t("roles.updateDialog")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("roles.updateDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("roles.name")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: GESTIONNAIRE"
                                            {...field}
                                            disabled={isLoading}
                                            className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("roles.description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("roles.descriptionPlaceholder")}
                                            {...field}
                                            value={field.value || ""}
                                            disabled={isLoading}
                                            className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B] min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="rounded-[9px] border-[#F0E0C0]"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("roles.updating")}
                                    </>
                                ) : (
                                    t("common.save")
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
