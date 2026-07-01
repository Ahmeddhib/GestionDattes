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
import { updateAgriculteurAction } from "@/actions/agriculteurs/update-agriculteur.action";
import { updateAgriculteurSchema, type UpdateAgriculteurInput } from "@/validators/agriculteur.validator";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Agriculteur = {
    id: string;
    code: string;
    cin: string;
    nom: string;
    prenom: string;
    telephone: string | null;
    adresse: string | null;
    nbPalmiers: number;
    superficie: number | null;
    productionEstimee: number | null;
    regionId: string;
};

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface UpdateAgriculteurDialogProps {
    agriculteur: Agriculteur;
    regions: Region[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UpdateAgriculteurDialog({
    agriculteur,
    regions,
    open,
    onOpenChange,
}: UpdateAgriculteurDialogProps) {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UpdateAgriculteurInput>({
        resolver: zodResolver(updateAgriculteurSchema),
        defaultValues: {
            id: agriculteur.id,
            code: agriculteur.code,
            cin: agriculteur.cin,
            nom: agriculteur.nom,
            prenom: agriculteur.prenom,
            telephone: agriculteur.telephone || "",
            adresse: agriculteur.adresse || "",
            nbPalmiers: agriculteur.nbPalmiers,
            superficie: agriculteur.superficie || undefined,
            productionEstimee: agriculteur.productionEstimee || undefined,
            regionId: agriculteur.regionId,
        },
    });

    useEffect(() => {
        form.reset({
            id: agriculteur.id,
            code: agriculteur.code,
            cin: agriculteur.cin,
            nom: agriculteur.nom,
            prenom: agriculteur.prenom,
            telephone: agriculteur.telephone || "",
            adresse: agriculteur.adresse || "",
            nbPalmiers: agriculteur.nbPalmiers,
            superficie: agriculteur.superficie || undefined,
            productionEstimee: agriculteur.productionEstimee || undefined,
            regionId: agriculteur.regionId,
        });
    }, [agriculteur, form]);

    const onSubmit = async (data: UpdateAgriculteurInput) => {
        try {
            setIsLoading(true);

            const result = await updateAgriculteurAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.updated", { entity: t("agriculteurs.title") }));
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
            <DialogContent className="sm:max-w-[600px] bg-white border-[#F0E0C0] rounded-[14px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">{t("agriculteurs.updateDialog")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("agriculteurs.updateDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.code")}</FormLabel>
                                            <FormControl>
                                                <Input
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
                                    name="cin"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.cin")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    maxLength={8}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.nom")}</FormLabel>
                                            <FormControl>
                                                <Input
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
                                    name="prenom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.prenom")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="telephone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.telephone")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ""}
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
                                    name="regionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.region")}</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {regions.map((region) => (
                                                        <SelectItem key={region.id} value={region.id}>
                                                            {region.nom}
                                                            {region.code && ` (${region.code})`}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="adresse"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#3D1C00]">{t("agriculteurs.adresse")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                disabled={isLoading}
                                                className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nbPalmiers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.nbPalmiers")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
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
                                    name="superficie"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.superficie")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ? parseFloat(e.target.value) : undefined
                                                        )
                                                    }
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
                                    name="productionEstimee"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.production")}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) =>
                                                        field.onChange(
                                                            e.target.value ? parseFloat(e.target.value) : undefined
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                    className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

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
