"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, User, Package, Check, ChevronsUpDown, Boxes, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { SaisonActiveField, type SaisonActive } from "@/components/features/saisons/SaisonActiveField";
import { SaisonOrigineBadge } from "./SaisonOrigineBadge";
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { getStockLotsForVenteAction } from "@/actions/ventes/get-stock-lots-for-vente.action";
import { createVenteAction } from "@/actions/ventes/create-vente.action";
import { getCaisseStockOverviewAction } from "@/actions/stock-caisses/caisse-stock.actions";

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

type ClientOption = { id: string; nom: string };
type StockLotOption = {
    id: string;
    typeDate: string;
    numeroLot: string;
    quantiteDisponible: number;
    saisonOrigineId: string;
    saisonNom: string;
};
type StockCaisseTypeOption = {
    id: string;
    nom: string;
    quantiteWakala: number;
    proprietairesClients: Array<{ clientId: string; quantite: number }>;
};

export function CreateVenteDialog({ saisonActive }: { saisonActive?: SaisonActive }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [lots, setLots] = useState<StockLotOption[]>([]);
    const [stockMax, setStockMax] = useState(0);
    const [stockPopoverOpen, setStockPopoverOpen] = useState(false);
    const [stockCaisses, setStockCaisses] = useState<StockCaisseTypeOption[]>([]);

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
        caisses: z.array(z.object({
            proprietaire: z.enum(["WAKALA", "CLIENT"]),
            typeCaisseId: z.string().min(1, t("validation.required")),
            quantite: z.coerce.number().int().positive(t("validation.positive")),
        })),
    });

    type FormData = {
        clientId: string;
        stockId: string;
        quantite: number;
        prixUnitaire: number;
        caisses: Array<{ proprietaire: "WAKALA" | "CLIENT"; typeCaisseId: string; quantite: number }>;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as Resolver<FormData>,
        defaultValues: {
            clientId: "",
            stockId: "",
            quantite: undefined!,
            prixUnitaire: undefined!,
            caisses: [],
        },
    });
    const caisseFields = useFieldArray({ control: form.control, name: "caisses" });

    const watchQuantite = useWatch({ control: form.control, name: "quantite" });
    const watchPrixUnitaire = useWatch({ control: form.control, name: "prixUnitaire" });
    const watchClientId = useWatch({ control: form.control, name: "clientId" });
    const watchCaisses = useWatch({ control: form.control, name: "caisses" });
    const montantTotal = (watchQuantite || 0) * (watchPrixUnitaire || 0);
    const stocksDuClient = watchClientId
        ? stockCaisses
            .map((type) => ({
                id: type.id,
                nom: type.nom,
                quantite: type.proprietairesClients.find((stock) => stock.clientId === watchClientId)?.quantite ?? 0,
            }))
            .filter((stock) => stock.quantite > 0)
        : [];

    async function loadData() {
        const [clientsResult, lotsResult, caissesResult] = await Promise.all([
            getClientsAction(),
            getStockLotsForVenteAction(),
            getCaisseStockOverviewAction(),
        ]);
        if (clientsResult.success) setClients(clientsResult.data || []);
        if (lotsResult.success) setLots(lotsResult.data || []);
        if (caissesResult.success) setStockCaisses(caissesResult.data.parType || []);
    }

    async function onSubmit(data: FormData) {
        setLoading(true);

        const formData = new FormData();
        formData.append("clientId", data.clientId);
        formData.append("stockId", data.stockId);
        formData.append("quantite", data.quantite.toString());
        formData.append("prixUnitaire", data.prixUnitaire.toString());
        formData.append("caisses", JSON.stringify(data.caisses.map((caisse) => ({
            ...caisse,
            ...(caisse.proprietaire === "CLIENT" && { clientProprietaireId: data.clientId }),
        }))));

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
        if (newOpen) {
            void loadData();
        } else {
            form.reset();
            setStockMax(0);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F] sm:w-auto">
                    <Plus className="h-4 w-4" />
                    {t("finance.ventes.nouvelleVente")}
                </Button>
            </DialogTrigger>
            {/* Élargi : le sélecteur de lot affiche désormais type + numéro +
                saison d'origine + quantité. À 125 la liste débordait du dialogue
                et l'ensemble paraissait désaligné. */}
            {/* 700px (`max-w-175`) seulement à partir de `md`. Appliquée dès
                `sm` (640px), cette largeur dépassait la fenêtre entre 640 et
                700px — téléphone en paysage, petite tablette — et le dialogue
                collait aux deux bords, sans marge. */}
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden rounded-lg bg-card p-3 sm:w-full sm:max-w-[calc(100%-2rem)] sm:p-5 md:max-w-175">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle className="text-foreground">{t("finance.ventes.nouvelleVente")}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("finance.ventes.description")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {saisonActive && <SaisonActiveField saison={saisonActive} />}

                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">{t("finance.ventes.client")}</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value);
                                            caisseFields.replace([]);
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-10 w-full rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("finance.ventes.client")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            {clients.length === 0 ? (
                                                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                                                    {t("finance.ventes.aucunClient")}
                                                </div>
                                            ) : (
                                                clients.map((c) => (
                                                    <SelectItem key={c.id} value={c.id} className="py-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <User className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                            <span className="truncate font-medium text-foreground">
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

                        {watchClientId && (
                            <section className="rounded-md border border-sky-200 bg-sky-50/70 p-3 dark:border-sky-800/70 dark:bg-sky-950/20">
                                <div className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-100">
                                    <Boxes className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    {t("caisseStock.clientCratesAvailable")}
                                </div>
                                {stocksDuClient.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {stocksDuClient.map((stock) => (
                                            <Badge key={stock.id} variant="outline" className="border-sky-300 bg-white text-sky-900 dark:border-sky-700 dark:bg-sky-950/50 dark:text-sky-100">
                                                {stock.nom} · {stock.quantite} {t("caisseStock.available")}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-xs text-sky-700 dark:text-sky-300">
                                        {t("caisseStock.noClientCrates")}
                                    </p>
                                )}
                            </section>
                        )}

                        <FormField
                            control={form.control}
                            name="stockId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">{t("finance.ventes.lotStock")}</FormLabel>
                                    <Popover open={stockPopoverOpen} onOpenChange={setStockPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={stockPopoverOpen}
                                                    className="h-10 w-full justify-between rounded-sm border-border bg-card font-normal hover:bg-card"
                                                >
                                                    {field.value ? (
                                                        (() => {
                                                            const selected = lots.find((l) => l.id === field.value);
                                                            if (!selected) return t("finance.ventes.lotStock");
                                                            return (
                                                                <span className="flex min-w-0 items-center gap-2 truncate">
                                                                    <Package className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                                    <span className="truncate">
                                                                        <span className="font-medium text-foreground">
                                                                            {selected.typeDate}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {" "}
                                                                            · Lot {selected.numeroLot}
                                                                        </span>
                                                                    </span>
                                                                    {/* La saison reste visible popover fermé :
                                                                        c'est au moment de valider que l'on doit
                                                                        savoir si l'on écoule un report. */}
                                                                    <SaisonOrigineBadge
                                                                        saisonNom={selected.saisonNom}
                                                                        estReporte={
                                                                            selected.saisonOrigineId !== saisonActive?.id
                                                                        }
                                                                    />
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
                                            // `portal={false}` : dans un dialogue, `react-remove-scroll`
                                            // annule la molette hors de son sous-arbre. Portalisée, la
                                            // liste ne défilait qu'à la barre de défilement.
                                            portal={false}
                                            // Syntaxe Tailwind v4 : `w-(--var)`. Écrite
                                            // `w-[--var]` (v3), la règle sortait en
                                            // `width:--radix-popover-trigger-width`, sans
                                            // `var()` — invalide, donc ignorée par le
                                            // navigateur. La liste n'avait alors aucune
                                            // largeur et se dimensionnait à son contenu au
                                            // lieu de suivre le champ.
                                            className="w-(--radix-popover-trigger-width) bg-card p-0"
                                        >
                                            <Command
                                                className="bg-card"
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
                                                                // La saison fait partie du `value` : le `filter` du
                                                                // Command porte dessus, donc taper « 2024-2025 »
                                                                // retrouve les lots reportés. Sans cela la saison
                                                                // serait affichée mais non recherchable.
                                                                value={`${l.typeDate} Lot ${l.numeroLot} ${l.saisonNom}`}
                                                                onSelect={() => {
                                                                    field.onChange(l.id);
                                                                    setStockMax(l.quantiteDisponible);
                                                                    if ((form.getValues("quantite") || 0) > l.quantiteDisponible) void form.trigger("quantite");
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
                                                                {/* `flex-wrap` : sous ~400px, type + lot + saison +
                                                                    quantite ne tiennent pas sur une ligne. Plutot que
                                                                    de rogner le nom de la saison — l'information que
                                                                    l'on vient justement lire — les badges passent a la
                                                                    ligne suivante. */}
                                                                {/* `min-w-0 flex-1` et non `w-full` : `w-full` valait
                                                                    100% de la ligne alors que l'icone de coche et son
                                                                    ecart occupent deja 24px — la ligne debordait
                                                                    d'autant, et la quantite se faisait rogner. */}
                                                                <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                                                    <div className="flex min-w-0 flex-1 items-center gap-2">
                                                                        <Package className="h-4 w-4 shrink-0 text-[#C17A2B]" />
                                                                        <span className="min-w-0 truncate">
                                                                            <span className="font-medium text-foreground">
                                                                                {l.typeDate}
                                                                            </span>
                                                                            <span className="text-muted-foreground">
                                                                                {" "}
                                                                                · Lot {l.numeroLot}
                                                                            </span>
                                                                        </span>
                                                                    </div>
                                                                    {/* Peut se comprimer : la quantité (`shrink-0`)
                                                                        est prioritaire, la saison s'abrège. */}
                                                                    {/* `flex-wrap` ici aussi : sur 360px, saison + quantite
                                                                        depassaient de ~10px et c'est la mention
                                                                        « · report » qui sautait — l'alerte meme. La
                                                                        quantite passe a la ligne, le motif reste entier. */}
                                                                    <div className="ms-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                                                                        <SaisonOrigineBadge
                                                                            saisonNom={l.saisonNom}
                                                                            estReporte={
                                                                                l.saisonOrigineId !== saisonActive?.id
                                                                            }
                                                                        />
                                                                        <Badge
                                                                            className={`shrink-0 border-0 ${stockLevelBadgeClass(l.quantiteDisponible)}`}
                                                                        >
                                                                            {l.quantiteDisponible} kg
                                                                        </Badge>
                                                                    </div>
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

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="quantite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground">
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
                                                className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
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
                                        <FormLabel className="text-foreground">
                                            {t("finance.ventes.prixUnitaire")}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.001"
                                                min="0"
                                                className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
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

                        <section className="space-y-3 rounded-lg border border-border bg-muted/35 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Boxes className="h-4 w-4 text-[#C17A2B]" />
                                        {t("caisseStock.usedCrates")}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Optionnel — sélectionnez la propriété réelle de chaque caisse.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => caisseFields.append({ proprietaire: "CLIENT", typeCaisseId: "", quantite: 1 })}
                                    disabled={!watchClientId}
                                >
                                    <Plus className="h-4 w-4" /> {t("caisseStock.add")}
                                </Button>
                            </div>

                            {caisseFields.fields.map((item, index) => {
                                const proprietaire = watchCaisses?.[index]?.proprietaire;
                                const clientId = watchClientId;
                                return (
                                    <div key={item.id} className="grid min-w-0 gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-[8rem_minmax(0,1fr)_7rem_auto]">
                                        <FormField
                                            control={form.control}
                                            name={`caisses.${index}.proprietaire`}
                                            render={({ field }) => (
                                                <FormItem className="min-w-0">
                                                    <FormLabel>{t("caisseStock.owner")}</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl><SelectTrigger className="w-full min-w-0"><SelectValue /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="CLIENT">Client</SelectItem>
                                                            <SelectItem value="WAKALA">Wakala</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`caisses.${index}.typeCaisseId`}
                                            render={({ field }) => (
                                                <FormItem className="min-w-0">
                                                    <FormLabel>Type de caisse</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl><SelectTrigger className="w-full min-w-0"><SelectValue placeholder={t("caisseStock.select")} /></SelectTrigger></FormControl>
                                                        <SelectContent position="popper">
                                                            {stockCaisses.map((type) => {
                                                                const disponible = proprietaire === "WAKALA"
                                                                    ? type.quantiteWakala
                                                                    : type.proprietairesClients.find((stock) => stock.clientId === clientId)?.quantite ?? 0;
                                                                return <SelectItem key={type.id} value={type.id} disabled={disponible <= 0}>{type.nom} — {disponible} {t("caisseStock.available")}</SelectItem>;
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`caisses.${index}.quantite`}
                                            render={({ field }) => (
                                                <FormItem className="min-w-0">
                                                    <FormLabel>Quantité</FormLabel>
                                                    <FormControl><Input type="number" min={1} step={1} {...field} onChange={(event) => field.onChange(Number(event.target.value))} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" className="justify-self-end self-end text-red-600 md:justify-self-start" onClick={() => caisseFields.remove(index)} aria-label="Retirer cette ligne">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </section>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted p-3">
                            <span className="text-sm font-medium text-foreground">
                                {t("finance.ventes.montantTotal")}
                            </span>
                            <span className="text-lg font-bold text-[#C17A2B]">{montantTotal.toFixed(2)}</span>
                        </div>

                        <div className="sticky -bottom-3 z-10 -mx-3 flex flex-col-reverse gap-2 border-t border-border bg-card/95 px-3 pb-1 pt-3 backdrop-blur sm:-bottom-5 sm:-mx-5 sm:flex-row sm:justify-end sm:px-5 sm:pb-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="w-full rounded-md sm:w-auto"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || stockMax === 0}
                                className="w-full rounded-md bg-[#C17A2B] hover:bg-[#A0621F] sm:w-auto"
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
