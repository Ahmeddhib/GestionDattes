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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAgriculteurAction } from "@/actions/agriculteurs/create-agriculteur.action";
import { createAgriculteurSchema, type CreateAgriculteurInput } from "@/validators/agriculteur.validator";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Region = {
    id: string;
    nom: string;
    code: string | null;
};

interface CreateAgriculteurDialogProps {
    regions: Region[];
}

export function CreateAgriculteurDialog({ regions }: CreateAgriculteurDialogProps) {
    const router = useRouter();
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateAgriculteurInput>({
        resolver: zodResolver(createAgriculteurSchema),
        defaultValues: {
            // code auto-généré côté serveur
            cin: "",
            nom: "",
            prenom: "",
            telephone: "",
            adresse: "",
            nbPalmiers: 1,
            superficie: undefined,
            productionEstimee: undefined,
            regionId: "",
        },
    });

    const onSubmit = async (data: CreateAgriculteurInput) => {
        try {
            setIsLoading(true);

            const result = await createAgriculteurAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.created", { entity: t("agriculteurs.title") }));
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
                    {t("agriculteurs.createNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white border-[#F0E0C0] rounded-[14px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">{t("agriculteurs.createDialog")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("agriculteurs.createDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Informations Personnelles */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#3D1C00]">
                                {t("agriculteurs.personalInfo")}
                            </h3>

                            {/* Info banner: code auto-généré */}
                            <div className="bg-[#C17A2B]/10 border border-[#C17A2B]/20 rounded-[7px] p-3 flex items-start gap-2">
                                <span className="text-[#C17A2B] text-lg">💡</span>
                                <p className="text-sm text-[#3D1C00]/80">
                                    <strong className="text-[#C17A2B]">{t("agriculteurs.code")}</strong> : Un code unique sera généré automatiquement (ex: AGR-0001)
                                </p>
                            </div>

                            <FormField
                                control={form.control}
                                name="cin"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#3D1C00]">{t("agriculteurs.cin")} *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="12345678"
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

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nom"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.nom")} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ben Ahmed"
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
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.prenom")} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Mohamed"
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
                                                    placeholder="+216 98 123 456"
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
                                    name="regionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.region")} *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isLoading}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-[7px] border-[#F0E0C0] focus:border-[#C17A2B] focus:ring-[#C17A2B]">
                                                        <SelectValue placeholder="Sélectionner" />
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
                                                placeholder="Douz, Kebili"
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

                        {/* Informations Exploitation */}
                        <div className="space-y-4 pt-4 border-t border-[#F0E0C0]">
                            <h3 className="text-sm font-semibold text-[#3D1C00]">
                                {t("agriculteurs.exploitationInfo")}
                            </h3>

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="nbPalmiers"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[#3D1C00]">{t("agriculteurs.nbPalmiers")} *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    placeholder="150"
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
                                                    placeholder="2.5"
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
                                                    placeholder="3000"
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
                                onClick={() => setOpen(false)}
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
