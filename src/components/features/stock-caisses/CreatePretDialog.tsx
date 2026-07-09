"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createPretAction } from "@/actions/prets-caisses/create-pret.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function CreatePretDialog() {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agriculteurs, setAgriculteurs] = useState<any[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<any[]>([]);
    const [stockMax, setStockMax] = useState(0);

    // Schéma de validation dynamique
    const formSchema = z.object({
        agriculteurId: z.string().min(1, t("validation.required")),
        typeCaisseId: z.string().min(1, t("validation.required")),
        nombrePrete: z.preprocess(
            (val) => (val === "" || val === undefined ? undefined : Number(val)),
            z.number({ message: t("validation.integer") })
                .int(t("validation.integer"))
                .min(1, t("validation.minValue").replace("{min}", "1"))
                .max(
                    stockMax > 0 ? stockMax : 999999,
                    stockMax > 0
                        ? `${t("pretsCaisses.stockInsuffisant")} (Max: ${stockMax})`
                        : t("validation.required")
                )
        ),
        observations: z.string().optional(),
    });

    type FormData = {
        agriculteurId: string;
        typeCaisseId: string;
        nombrePrete: number;
        observations?: string;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            agriculteurId: "",
            typeCaisseId: "",
            nombrePrete: undefined as any,
            observations: "",
        },
    });

    useEffect(() => {
        if (open) loadData();
    }, [open]);

    // Mettre à jour le stock max quand le type de caisse change
    const watchTypeCaisse = form.watch("typeCaisseId");
    useEffect(() => {
        if (watchTypeCaisse) {
            const type = typesCaisses.find(t => t.id === watchTypeCaisse);
            const newStockMax = type?.stockDisponible || 0;
            setStockMax(newStockMax);

            // Revalider le champ nombrePrete si nécessaire
            const currentValue = form.getValues("nombrePrete");
            if (currentValue && currentValue > newStockMax) {
                form.trigger("nombrePrete");
            }
        }
    }, [watchTypeCaisse, typesCaisses, form]);

    async function loadData() {
        const [agriResult, caissesResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesCaissesAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        // Créer un FormData pour l'action serveur
        const formData = new FormData();
        formData.append("agriculteurId", data.agriculteurId);
        formData.append("typeCaisseId", data.typeCaisseId);
        formData.append("nombrePrete", data.nombrePrete.toString());
        if (data.observations) {
            formData.append("observations", data.observations);
        }

        const result = await createPretAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("pretsCaisses.nouveauPret")));
            setOpen(false);
            form.reset();
            setStockMax(0);
            // Recharger la page pour voir les changements
            window.location.reload();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            form.reset();
            setStockMax(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("pretsCaisses.nouveauPret")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("pretsCaisses.preterCaisses")}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("pretsCaisses.nouveauPretDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Agriculteur */}
                        <FormField
                            control={form.control}
                            name="agriculteurId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("pretsCaisses.agriculteur")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("pretsCaisses.selectAgriculteur")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {agriculteurs.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Type Caisse */}
                        <FormField
                            control={form.control}
                            name="typeCaisseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("pretsCaisses.typeCaisse")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("pretsCaisses.selectTypeCaisse")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {typesCaisses.map((tc) => (
                                                <SelectItem key={tc.id} value={tc.id}>
                                                    {tc.nom} ({tc.poidsKg} kg) - Stock: {tc.stockDisponible || 0}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        {/* Nombre */}
                        <FormField
                            control={form.control}
                            name="nombrePrete"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("pretsCaisses.nombrePrete")}
                                        {stockMax > 0 && (
                                            <span className="text-orange-600 ml-1">(Max: {stockMax})</span>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder={t("pretsCaisses.nombrePreterPlaceholder")}
                                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                            {...field}
                                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                    {stockMax === 0 && field.value && (
                                        <p className="text-xs text-red-600">
                                            {t("pretsCaisses.stockInsuffisantMessage")}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        {/* Observations */}
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">
                                        {t("pretsCaisses.observations")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("pretsCaisses.notesOptionnelles")}
                                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="rounded-[9px]"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || stockMax === 0}
                                className="rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                {loading ? t("pretsCaisses.preting") : t("common.create")}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
