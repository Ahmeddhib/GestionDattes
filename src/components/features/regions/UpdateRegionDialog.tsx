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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateRegionAction } from "@/actions/regions/update-region.action";
import { updateRegionSchema, type UpdateRegionInput } from "@/validators/region.validator";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface UpdateRegionDialogProps {
    region: Region;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateRegionDialog({ region, open, onOpenChange }: UpdateRegionDialogProps) {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UpdateRegionInput>({
        resolver: zodResolver(updateRegionSchema),
        defaultValues: {
            id: region.id,
            nom: region.nom,
            code: region.code || "",
        },
    });

    // Reset form when region changes
    useEffect(() => {
        form.reset({
            id: region.id,
            nom: region.nom,
            code: region.code || "",
        });
    }, [region, form]);

    const onSubmit = async (data: UpdateRegionInput) => {
        try {
            setIsLoading(true);

            const result = await updateRegionAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("regions.title") }));
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
            <DialogContent className="sm:max-w-[500px] bg-white border-[#F0E0C0] rounded-[14px]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">{t("regions.updateDialog")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("regions.updateDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("regions.name")} *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Kebili"
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
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("regions.codeOptional")}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: KB"
                                            {...field}
                                            disabled={isLoading}
                                            className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
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
                                onClick={() => onOpenChange(false)}
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
                                        {t("common.loading")}
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
