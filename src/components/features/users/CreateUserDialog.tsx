"use client";

import { useState } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUserAction } from "@/actions/users/create-user.action";
import { createUserValidator, type CreateUserInput } from "@/validators/user.validator";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface CreateUserDialogProps {
    roles: Array<{ id: string; name: string }>;
    open: boolean;
    onClose: () => void;
}

export function CreateUserDialog({ roles, open, onClose }: CreateUserDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateUserInput>({
        resolver: zodResolver(createUserValidator),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            roleId: roles[0]?.id || "",
        },
    });

    const onSubmit = async (data: CreateUserInput) => {
        try {
            setIsLoading(true);

            const result = await createUserAction(data);

            if ("error" in result) {
                const errorMessage = typeof result.error === "string"
                    ? result.error
                    : t("messages.error.generic");
                toast.error(errorMessage);
                return;
            }

            toast.success(t("messages.success.created", { entity: t("users.title") }));
            form.reset();
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
                    <DialogTitle className="text-[#3D1C00]">{t("users.createDialog")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("users.createDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("users.name")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ahmed Ben Salah"
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
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("users.email")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="ahmed@dattes.tn"
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
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("users.password")} *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
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
                            name="roleId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("users.role")} *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isLoading}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]">
                                                <SelectValue placeholder={t("users.selectRole")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role.id} value={role.id}>
                                                    {role.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                        {t("users.creating")}
                                    </>
                                ) : (
                                    t("common.create")
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
