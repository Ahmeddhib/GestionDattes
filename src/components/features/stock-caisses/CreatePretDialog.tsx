"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Boxes, Building2, CheckCircle2, Plus, Trash2, UsersRound } from "lucide-react";
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
import { getClientsAction } from "@/actions/clients/get-clients.action";
import { getCaisseStockOverviewAction } from "@/actions/stock-caisses/caisse-stock.actions";
import { getLivreursAction } from "@/actions/livreurs/get-livreurs.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { SaisonActiveField, type SaisonActive } from "@/components/features/saisons/SaisonActiveField";

const AUCUN_LIVREUR = "none";
type SourcePret = { proprietaire: "WAKALA" | "CLIENT"; clientProprietaireId?: string; quantite: number };
type AgriculteurOption = { id: string; code: string; nom: string; prenom: string; label: string };
type TypeCaisseOption = { id: string; nom: string; poidsKg: number };
type LivreurOption = { id: string; nom: string; active: boolean };
type ClientOption = { id: string; nom: string };
type StockTypeOption = {
    id: string;
    quantiteTotale: number;
    quantiteWakala: number;
    proprietairesClients: Array<{ clientId: string; quantite: number }>;
};

export function CreatePretDialog({ saisonActive }: { saisonActive?: SaisonActive }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agriculteurs, setAgriculteurs] = useState<AgriculteurOption[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<TypeCaisseOption[]>([]);
    const [livreurs, setLivreurs] = useState<LivreurOption[]>([]);
    const [stockMax, setStockMax] = useState(0);
    const [clients, setClients] = useState<ClientOption[]>([]);
    const [stockParType, setStockParType] = useState<StockTypeOption[]>([]);
    const [sources, setSources] = useState<SourcePret[]>([{ proprietaire: "WAKALA", quantite: 1 }]);

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
        livreurId: z.string().optional(),
    });

    type FormData = {
        agriculteurId: string;
        typeCaisseId: string;
        nombrePrete: number;
        observations?: string;
        livreurId?: string;
    };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema) as Resolver<FormData>,
        defaultValues: {
            agriculteurId: "",
            typeCaisseId: "",
            nombrePrete: undefined!,
            observations: "",
            livreurId: AUCUN_LIVREUR,
        },
    });

    const watchTypeCaisse = useWatch({ control: form.control, name: "typeCaisseId" });
    const watchNombrePrete = useWatch({ control: form.control, name: "nombrePrete" });
    const stockSelectionne = stockParType.find((item) => item.id === watchTypeCaisse);
    const totalClientsDisponible = stockSelectionne?.proprietairesClients.reduce((total, item) => total + item.quantite, 0) ?? 0;
    const totalSources = sources.reduce((total, source) => total + (Number.isFinite(source.quantite) ? source.quantite : 0), 0);
    const ecartRepartition = (watchNombrePrete || 0) - totalSources;
    const clientsAvecStock = (stockSelectionne?.proprietairesClients ?? [])
        .filter((item) => item.quantite > 0)
        .map((item) => ({ ...item, nom: clients.find((client) => client.id === item.clientId)?.nom || item.clientId }));
    const wakalaDejaSelectionnee = sources.some((source) => source.proprietaire === "WAKALA");
    const clientsDejaSelectionnes = new Set(sources.flatMap((source) => source.clientProprietaireId ? [source.clientProprietaireId] : []));
    const ajoutSourceDisponible = !!watchTypeCaisse && (
        (!wakalaDejaSelectionnee && (stockSelectionne?.quantiteWakala ?? 0) > 0)
        || clientsAvecStock.some((client) => !clientsDejaSelectionnes.has(client.clientId))
    );

    const disponiblePourSource = (source: SourcePret) => source.proprietaire === "WAKALA"
        ? stockSelectionne?.quantiteWakala ?? 0
        : stockSelectionne?.proprietairesClients.find((item) => item.clientId === source.clientProprietaireId)?.quantite ?? 0;
    const cleSource = (source: SourcePret) => source.proprietaire === "WAKALA"
        ? "WAKALA"
        : `CLIENT:${source.clientProprietaireId || ""}`;
    const totalDemandePourSource = (source: SourcePret) => sources
        .filter((item) => cleSource(item) === cleSource(source))
        .reduce((total, item) => total + (Number.isFinite(item.quantite) ? item.quantite : 0), 0);

    const sourcesValides = !!watchTypeCaisse
        && sources.length > 0
        && sources.every((source) => source.quantite > 0
            && totalDemandePourSource(source) <= disponiblePourSource(source)
            && (source.proprietaire === "WAKALA" || !!source.clientProprietaireId))
        && totalSources === (watchNombrePrete || 0);

    const ajouterSource = () => {
        if (!wakalaDejaSelectionnee && (stockSelectionne?.quantiteWakala ?? 0) > 0) {
            setSources((current) => [...current, { proprietaire: "WAKALA", quantite: 1 }]);
            return;
        }
        const client = clientsAvecStock.find((item) => !clientsDejaSelectionnes.has(item.clientId));
        if (client) setSources((current) => [...current, { proprietaire: "CLIENT", clientProprietaireId: client.clientId, quantite: 1 }]);
    };

    const changerProprietaire = (index: number, proprietaire: "WAKALA" | "CLIENT") => {
        const premierClient = clientsAvecStock.find((client) => !sources.some((source, sourceIndex) => sourceIndex !== index && source.clientProprietaireId === client.clientId));
        setSources((current) => current.map((source, sourceIndex) => sourceIndex === index
            ? { proprietaire, clientProprietaireId: proprietaire === "CLIENT" ? premierClient?.clientId : undefined, quantite: Math.max(1, source.quantite) }
            : source));
    };

    async function loadData() {
        const [agriResult, caissesResult, livreursResult, clientsResult, overviewResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesCaissesAction(),
            getLivreursAction(),
            getClientsAction(),
            getCaisseStockOverviewAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
        if (livreursResult.success) setLivreurs((livreursResult.data || []).filter((livreur) => livreur.active));
        if (clientsResult.success) setClients(clientsResult.data || []);
        if (overviewResult.success) setStockParType(overviewResult.data.parType || []);
    }

    async function onSubmit(data: FormData) {
        if (!sourcesValides || totalSources !== data.nombrePrete) {
            toast.error(t("caisseStock.sourceSumError"));
            return;
        }
        setLoading(true);

        // Créer un FormData pour l'action serveur
        const formData = new FormData();
        formData.append("agriculteurId", data.agriculteurId);
        formData.append("typeCaisseId", data.typeCaisseId);
        formData.append("nombrePrete", data.nombrePrete.toString());
        if (data.observations) {
            formData.append("observations", data.observations);
        }
        if (data.livreurId && data.livreurId !== AUCUN_LIVREUR) {
            formData.append("livreurId", data.livreurId);
        }
        formData.append("sources", JSON.stringify(sources));

        const result = await createPretAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("pretsCaisses.nouveauPret")));
            setOpen(false);
            form.reset();
            setStockMax(0);
            setSources([{ proprietaire: "WAKALA", quantite: 1 }]);
            // Rafraîchir les données de la page sans recharger tout le navigateur
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
            setSources([{ proprietaire: "WAKALA", quantite: 1 }]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 rounded-md bg-[#C17A2B] hover:bg-[#A0621F] sm:w-auto">
                    <Plus className="h-4 w-4" />
                    {t("pretsCaisses.nouveauPret")}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden rounded-lg bg-card p-3 sm:w-full sm:max-w-[calc(100%-2rem)] sm:p-5 md:max-w-2xl">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle className="text-foreground">
                        {t("pretsCaisses.preterCaisses")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("pretsCaisses.nouveauPretDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {saisonActive && <SaisonActiveField saison={saisonActive} />}

                        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                        {/* Agriculteur */}
                        <FormField
                            control={form.control}
                            name="agriculteurId"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.agriculteur")}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0 rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectAgriculteur")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
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
                                <FormItem className="min-w-0">
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.typeCaisse")}
                                    </FormLabel>
                                    <Select onValueChange={(value) => {
                                        field.onChange(value);
                                        const stock = stockParType.find((item) => item.id === value);
                                        const disponible = stock?.quantiteTotale ?? 0;
                                        setStockMax(disponible);
                                        const premierClient = stock?.proprietairesClients.find((item) => item.quantite > 0);
                                        setSources([stock && stock.quantiteWakala <= 0 && premierClient
                                            ? { proprietaire: "CLIENT", clientProprietaireId: premierClient.clientId, quantite: 1 }
                                            : { proprietaire: "WAKALA", quantite: 1 }]);
                                        const nombreActuel = form.getValues("nombrePrete") || 0;
                                        if (nombreActuel > disponible) {
                                            form.setValue("nombrePrete", undefined!, { shouldValidate: true });
                                        } else if (nombreActuel > 0) {
                                            void form.trigger("nombrePrete");
                                        }
                                    }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0 rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectTypeCaisse")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent position="popper" className="max-w-[calc(100vw-1rem)] bg-card">
                                            {typesCaisses.map((tc) => {
                                                const stock = stockParType.find((item) => item.id === tc.id);
                                                return <SelectItem key={tc.id} value={tc.id}>
                                                    {tc.nom} ({tc.poidsKg} kg) · {t("caisseStock.totalAvailable")}: {stock?.quantiteTotale ?? 0}
                                                </SelectItem>;
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />
                        </div>

                        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                        {/* Livreur (facultatif) */}
                        <FormField
                            control={form.control}
                            name="livreurId"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.livreur")}
                                        <span className="text-muted-foreground ml-1 font-normal">
                                            ({t("common.optional")})
                                        </span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || AUCUN_LIVREUR}>
                                        <FormControl>
                                            <SelectTrigger className="w-full min-w-0 rounded-sm border-border bg-card">
                                                <SelectValue placeholder={t("pretsCaisses.selectLivreur")} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-card">
                                            <SelectItem value={AUCUN_LIVREUR}>
                                                {t("pretsCaisses.remiseParAgriculteur")}
                                            </SelectItem>
                                            {livreurs.map((l) => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.nom}
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
                                <FormItem className="min-w-0">
                                    <FormLabel className="text-foreground">
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
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                            {...field}
                                            value={field.value ?? ""}
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
                        </div>

                        <section className="min-w-0 space-y-3 rounded-xl border border-border bg-muted/25 p-3 sm:p-4">
                            <div className="flex items-start gap-3">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Boxes className="h-5 w-5" /></span>
                                <div><h3 className="font-semibold text-foreground">{t("caisseStock.availableStockTitle")}</h3><p className="text-xs text-muted-foreground">{t("caisseStock.stockBreakdownHint")}</p></div>
                            </div>

                            {!watchTypeCaisse ? (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground"><AlertCircle className="h-4 w-4" />{t("caisseStock.chooseCrateTypeFirst")}</div>
                            ) : (
                                <>
                                    <div className="grid min-w-0 gap-2 min-[430px]:grid-cols-3">
                                        <div className="min-w-0 rounded-lg border border-border bg-card p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Boxes className="h-4 w-4 shrink-0 text-amber-600" /><span className="truncate">{t("caisseStock.totalAvailable")}</span></p><p className="mt-1 break-words text-xl font-bold text-foreground">{(stockSelectionne?.quantiteTotale ?? 0).toLocaleString()} <span className="text-xs font-medium text-muted-foreground">{t("caisseStock.crates")}</span></p></div>
                                        <div className="min-w-0 rounded-lg border border-border bg-card p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="h-4 w-4 shrink-0 text-emerald-600" /><span className="truncate">Wakala</span></p><p className="mt-1 break-words text-xl font-bold text-foreground">{(stockSelectionne?.quantiteWakala ?? 0).toLocaleString()} <span className="text-xs font-medium text-muted-foreground">{t("caisseStock.crates")}</span></p></div>
                                        <div className="min-w-0 rounded-lg border border-border bg-card p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><UsersRound className="h-4 w-4 shrink-0 text-sky-600" /><span className="truncate">{t("caisseStock.clients")}</span></p><p className="mt-1 break-words text-xl font-bold text-foreground">{totalClientsDisponible.toLocaleString()} <span className="text-xs font-medium text-muted-foreground">{t("caisseStock.crates")}</span></p></div>
                                    </div>
                                    {clientsAvecStock.length > 0 ? <div className="flex flex-wrap gap-2">{clientsAvecStock.map((client) => <span key={client.clientId} className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-medium text-foreground">{client.nom}: {client.quantite.toLocaleString()}</span>)}</div> : <p className="text-xs text-muted-foreground">{t("caisseStock.noClientStock")}</p>}
                                </>
                            )}
                        </section>

                        <section className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-3 sm:p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div><h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Boxes className="h-4 w-4 text-primary" />{t("caisseStock.crateSources")}</h3><p className="text-xs text-muted-foreground">{t("caisseStock.sourceSumHint")}</p></div>
                                <Button type="button" size="sm" variant="outline" disabled={!ajoutSourceDisponible} onClick={ajouterSource}><Plus className="h-4 w-4" />{t("caisseStock.addSource")}</Button>
                            </div>

                            {sources.map((source, index) => {
                                const disponible = disponiblePourSource(source);
                                const depasseStock = totalDemandePourSource(source) > disponible;
                                const clientSelectionne = clientsAvecStock.find((client) => client.clientId === source.clientProprietaireId);
                                return <div key={index} className={`min-w-0 space-y-2 rounded-lg border p-3 ${depasseStock ? "border-destructive/60 bg-destructive/5" : "border-border bg-muted/20"}`}>
                                    <div className="grid min-w-0 gap-3 md:grid-cols-[8rem_minmax(0,1fr)_7rem_auto]">
                                        <div className="min-w-0 space-y-1"><label className="text-xs font-medium text-muted-foreground">{t("caisseStock.owner")}</label><Select disabled={!watchTypeCaisse} value={source.proprietaire} onValueChange={(value: "WAKALA" | "CLIENT") => changerProprietaire(index, value)}><SelectTrigger className="w-full min-w-0 bg-card"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="WAKALA" disabled={(stockSelectionne?.quantiteWakala ?? 0) <= 0 || sources.some((item, sourceIndex) => sourceIndex !== index && item.proprietaire === "WAKALA")}>Wakala · {stockSelectionne?.quantiteWakala ?? 0}</SelectItem><SelectItem value="CLIENT" disabled={clientsAvecStock.length === 0}>{t("caisseStock.client")}</SelectItem></SelectContent></Select></div>
                                        <div className="min-w-0 space-y-1"><label className="text-xs font-medium text-muted-foreground">{t("caisseStock.stockAccount")}</label>{source.proprietaire === "CLIENT" ? <Select disabled={!watchTypeCaisse} value={source.clientProprietaireId || ""} onValueChange={(clientProprietaireId) => setSources((current) => current.map((item, i) => i === index ? { ...item, clientProprietaireId } : item))}><SelectTrigger className="w-full min-w-0 bg-card"><SelectValue placeholder={t("caisseStock.clientOwner")} /></SelectTrigger><SelectContent position="popper">{clientsAvecStock.map((client) => <SelectItem key={client.clientId} value={client.clientId} disabled={sources.some((item, sourceIndex) => sourceIndex !== index && item.clientProprietaireId === client.clientId)}>{client.nom} · {client.quantite} {t("caisseStock.available")}</SelectItem>)}</SelectContent></Select> : <div className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground"><Building2 className="h-4 w-4 shrink-0 text-emerald-600" /><span className="truncate">{t("caisseStock.ownStock")}</span></div>}</div>
                                        <div className="min-w-0 space-y-1"><label className="text-xs font-medium text-muted-foreground">{t("caisseStock.quantity")}</label><Input aria-label={t("caisseStock.quantity")} disabled={!watchTypeCaisse} type="number" min={1} max={disponible || undefined} value={source.quantite || ""} onChange={(event) => setSources((current) => current.map((item, i) => i === index ? { ...item, quantite: Number(event.target.value) } : item))} className="w-full min-w-0 bg-card" /></div>
                                        <div className="flex items-end justify-end md:justify-start"><Button type="button" size="icon" variant="ghost" disabled={sources.length === 1} onClick={() => setSources((current) => current.filter((_, i) => i !== index))} aria-label={t("caisseStock.deleteSource")}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                                    </div>
                                    <p className={`flex items-center gap-1 text-xs ${depasseStock ? "text-destructive" : "text-muted-foreground"}`}>{depasseStock ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}{source.proprietaire === "CLIENT" && clientSelectionne ? `${clientSelectionne.nom} · ` : ""}{t("caisseStock.availableForSource")}: {disponible.toLocaleString()} {t("caisseStock.crates")}{depasseStock ? ` · ${t("caisseStock.sourceOverStock")}` : ""}</p>
                                </div>;
                            })}

                            <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${sourcesValides ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
                                <span className="font-medium text-foreground">{t("caisseStock.assigned")}: {totalSources.toLocaleString()} / {(watchNombrePrete || 0).toLocaleString()}</span>
                                <span className={sourcesValides ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>{sourcesValides ? t("caisseStock.distributionValid") : ecartRepartition >= 0 ? `${t("caisseStock.remainingToAssign")}: ${ecartRepartition.toLocaleString()}` : `${t("caisseStock.tooManyAssigned")}: ${Math.abs(ecartRepartition).toLocaleString()}`}</span>
                            </div>
                        </section>

                        {/* Observations */}
                        <FormField
                            control={form.control}
                            name="observations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">
                                        {t("pretsCaisses.observations")}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("pretsCaisses.notesOptionnelles")}
                                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-red-600 text-xs" />
                                </FormItem>
                            )}
                        />

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
                                disabled={loading || stockMax === 0 || !sourcesValides}
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
