"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, User, Package, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { getStockLotsForVenteAction } from "@/actions/ventes/get-stock-lots-for-vente.action";
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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

function stockLevelBadgeClass(quantite: number) {
    if (quantite <= 0) return "bg-red-100 text-red-700";
    if (quantite < 50) return "bg-orange-100 text-orange-700";
    return "bg-green-100 text-green-700";
}

export function CreateVenteDialog() {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [lots, setLots] = useState<any[]>([]);
    const [stockMax, setStockMax] = useState(0);
    const [stockPopoverOpen, setStockPopoverOpen] = useState(false);

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
    });

    type FormData = {
        clientId: string;
        stockId: string;
        quantite: number;
        prixUnitaire: number;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            clientId: "",
            stockId: "",
            quantite: undefined as any,
            prixUnitaire: undefined as any,
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
        const [clientsResult, lotsResult] = await Promise.all([
            getClientsAction(),
            getStockLotsForVenteAction(),
        ]);
        if (clientsResult.success) setClients(clientsResult.data || []);
        if (lotsResult.success) setLots(lotsResult.data || []);
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        const formData = new FormData();
        formData.append("clientId", data.clientId);
        formData.append("stockId", data.stockId);
        formData.append("quantite", data.quantite.toString());
        formData.append("prixUnitaire", data.prixUnitaire.toString());

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
                                            <SelectTrigger className="h-10 w-full rounded-sm border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("finance.ventes.client")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {clients.length === 0 ? (
                                                <div className="px-2 py-3 text-center text-sm text-[#3D1C00]/50">
                                                    {t("finance.ventes.aucunClient")}
                                                </div>
                                            ) : (
                                                clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id} className="py-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <User className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                            <span className="truncate font-medium text-[#3D1C00]">
                                                                {c.nom}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
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
                                    <Popover open={stockPopoverOpen} onOpenChange={setStockPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={stockPopoverOpen}
                                                    className="h-10 w-full justify-between rounded-sm border-[#C17A2B]/20 bg-white font-normal hover:bg-white"
                                                >
                                                    {field.value ? (
                                                        (() => {
                                                            const selected = lots.find((l) => l.id === field.value);
                                                            if (!selected) return t("finance.ventes.lotStock");
                                                            return (
                                                                <span className="flex min-w-0 items-center gap-2 truncate">
                                                                    <Package className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                                    <span className="truncate">
                                                                        <span className="font-medium text-[#3D1C00]">
                                                                            {selected.typeDate}
                                                                        </span>
                                                                        <span className="text-[#3D1C00]/50">
                                                                            {" "}
                                                                            · Lot {selected.numeroLot}
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                            );
                                                        })()
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            {t("finance.ventes.lotStock")}
                                                        </span>
                                                    )}
                                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            align="start"
                                            className="w-[--radix-popover-trigger-width] bg-white p-0"
                                        >
                                            <Command
                                                className="bg-white"
                                                filter={(value, search) =>
                                                    value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                                                }
                                            >
                                                <CommandInput
                                                    placeholder={t("finance.ventes.rechercherLot")}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>
                                                        {t("finance.ventes.aucunLot")}
                                                    </CommandEmpty>
                                                    <CommandGroup>
                                                        {lots.map((l) => (
                                                            <CommandItem
                                                                key={l.id}
                                                                value={`${l.typeDate} Lot ${l.numeroLot}`}
                                                                onSelect={() => {
                                                                    field.onChange(l.id);
                                                                    setStockPopoverOpen(false);
                                                                }}
                                                                className="py-2"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4",
                                                                        field.value === l.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex w-full items-center justify-between gap-3">
                                                                    <div className="flex min-w-0 items-center gap-2">
                                                                        <Package className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                                        <span className="truncate">
                                                                            <span className="font-medium text-[#3D1C00]">
                                                                                {l.typeDate}
                                                                            </span>
                                                                            <span className="text-[#3D1C00]/50">
                                                                                {" "}
                                                                                · Lot {l.numeroLot}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    <Badge
                                                                        className={`shrink-0 border-0 ${stockLevelBadgeClass(l.quantiteDisponible)}`}
                                                                    >
                                                                        {l.quantiteDisponible} kg
                                                                    </Badge>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
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
