"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { getStockLotsForVenteAction } from "@/actions/ventes/get-stock-lots-for-vente.action";
import { getSaisonsActivesAction } from "@/actions/saisons/get-saisons.action";
import { createVenteAction } from "@/actions/ventes/create-vente.action";

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

const AUCUNE_SAISON = "none";

export function CreateVenteDialog() {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [lots, setLots] = useState<any[]>([]);
    const [saisons, setSaisons] = useState<any[]>([]);
    const [stockMax, setStockMax] = useState(0);

    const formSchema = z.object({
        clientId: z.string().min(1, t("validation.required")),
        stockId: z.string().min(1, t("validation.required")),
        quantite: z.preprocess(
            (val) => (val === "" || val === undefined ? undefined : Number(val)),
            z
                .number({ message: t("validation.required") })
                .positive(t("validation.positive"))
                .max(
                    stockMax > 0 ? stockMax : 999999999,
                    stockMax > 0 ? `Stock disponible: ${stockMax}` : t("validation.required")
                )
        ),
        prixUnitaire: z.preprocess(
            (val) => (val === "" || val === undefined ? undefined : Number(val)),
            z.number({ message: t("validation.required") }).positive(t("validation.positive"))
        ),
        saisonId: z.string().optional(),
    });

    type FormData = {
        clientId: string;
        stockId: string;
        quantite: number;
        prixUnitaire: number;
        saisonId?: string;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            clientId: "",
            stockId: "",
            quantite: undefined as any,
            prixUnitaire: undefined as any,
            saisonId: AUCUNE_SAISON,
        },
    });

    useEffect(() => {
        if (open) loadData();
    }, [open]);

    const watchStockId = form.watch("stockId");
    useEffect(() => {
        if (watchStockId) {
            const lot = lots.find((l) => l.id === watchStockId);
            const newMax = lot?.quantiteDisponible || 0;
            setStockMax(newMax);

            const currentValue = form.getValues("quantite");
            if (currentValue && currentValue > newMax) {
                form.trigger("quantite");
            }
        }
    }, [watchStockId, lots, form]);

    const watchQuantite = form.watch("quantite");
    const watchPrixUnitaire = form.watch("prixUnitaire");
    const montantTotal = (watchQuantite || 0) * (watchPrixUnitaire || 0);

    async function loadData() {
        const [clientsResult, lotsResult, saisonsResult] = await Promise.all([
            getClientsAction(),
            getStockLotsForVenteAction(),
            getSaisonsActivesAction(),
        ]);
        if (clientsResult.success) setClients(clientsResult.data || []);
        if (lotsResult.success) setLots(lotsResult.data || []);
        if (saisonsResult.success) setSaisons(saisonsResult.data || []);
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        const formData = new FormData();
        formData.append("clientId", data.clientId);
        formData.append("stockId", data.stockId);
        formData.append("quantite", data.quantite.toString());
        formData.append("prixUnitaire", data.prixUnitaire.toString());
        if (data.saisonId && data.saisonId !== AUCUNE_SAISON) {
            formData.append("saisonId", data.saisonId);
        }

        const result = await createVenteAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created", { entity: t("finance.ventes.title") }));
            setOpen(false);
            form.reset();
            setStockMax(0);
            router.refresh();
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
                <Button className="gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("finance.ventes.nouvelleVente")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-125 bg-white">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">{t("finance.ventes.nouvelleVente")}</DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("finance.ventes.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("finance.ventes.client")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("finance.ventes.client")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.nom}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="stockId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[#3D1C00]">{t("finance.ventes.lotStock")}</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-sm border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("finance.ventes.lotStock")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {lots.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.typeDate} - Lot {l.numeroLot} - Stock: {l.quantiteDisponible}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="quantite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#3D1C00]">
                                            {t("finance.ventes.quantite")}
                                            {stockMax > 0 && (
                                                <span className="text-orange-600 ml-1">(Max: {stockMax})</span>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="rounded-sm border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600 text-xs" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="prixUnitaire"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#3D1C00]">
                                            {t("finance.ventes.prixUnitaire")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                className="rounded-sm border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(e) =>
                                                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-600 text-xs" />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {saisons.length > 0 && (
                            <FormField
                                control={form.control}
                                name="saisonId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[#3D1C00]">
                                            {t("finance.saisons.title")}
                                            <span className="text-[#3D1C00]/40 ml-1 font-normal">
                                                ({t("common.optional")})
                                            </span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || AUCUNE_SAISON}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-sm border-[#C17A2B]/20 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-white">
                                                <SelectItem value={AUCUNE_SAISON}>{t("common.all")}</SelectItem>
                                                {saisons.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>
                                                        {s.nom}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage className="text-red-600 text-xs" />
                                    </FormItem>
                                )}
                            />
                        )}

                        <div className="rounded-md bg-[#FAF0DC] p-3 flex items-center justify-between">
                            <span className="text-sm font-medium text-[#3D1C00]">
                                {t("finance.ventes.montantTotal")}
                            </span>
                            <span className="text-lg font-bold text-[#C17A2B]">{montantTotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="rounded-md"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || stockMax === 0}
                                className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
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
