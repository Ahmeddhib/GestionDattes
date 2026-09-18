"use client";

import { startTransition, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Boxes, Building2, Eye, History, PackageCheck, Plus, RotateCcw, Search, SlidersHorizontal, Truck, UsersRound, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { adjustWakalaStockAction, cancelReceptionCaissesAction, createReceptionCaissesAction } from "@/actions/stock-caisses/caisse-stock.actions";
import { downloadReceptionCaissesPDF } from "@/lib/reception-caisses-pdf";
import type { PdfBranding } from "@/lib/pdf-branding";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useTableQueryState } from "@/hooks/useTableQueryState";

type LigneReception = { typeCaisseId: string; quantite: number };
type StockOverview = {
    kpis: { stockPhysique: number; stockWakala: number; stockClients: number; pretsEnCours: number };
    parType: Array<{
        id: string;
        nom: string;
        poidsKg: number;
        quantiteTotale: number;
        quantiteWakala: number;
        quantiteClients: number;
        proprietairesClients: Array<{ clientId: string; client: string; quantite: number }>;
    }>;
};
type PageResult<T> = { items: T[]; currentPage: number; totalPages: number; totalItems: number };
type StockClientRow = {
    id: string;
    clientId: string;
    typeCaisseId: string;
    quantite: number;
    totalEntrees: number;
    totalSorties: number;
    Client: { nom: string };
    TypeCaisse: { nom: string };
    dernierMouvement: null | { type: string; createdAt: Date | string };
};
type ReceptionRow = {
    id: string;
    numero: string;
    date: Date | string;
    statut: "VALIDEE" | "ANNULEE";
    matriculeCamion: string | null;
    chauffeur: string | null;
    observations?: string | null;
    Client: { nom: string };
    Lignes: Array<{ quantite: number; TypeCaisse: { nom: string } }>;
};
type MouvementRow = {
    id: string;
    createdAt: Date | string;
    type: string;
    proprietaire: "WAKALA" | "CLIENT";
    direction: "ENTREE" | "SORTIE";
    quantite: number;
    reference: string | null;
    TypeCaisse: { nom: string };
    ClientProprietaire: { nom: string } | null;
    CreatedBy: { name: string };
};

function referenceLisible(reference: string | null) {
    if (!reference) return "—";
    if (reference.length <= 18) return reference;
    return `${reference.slice(0, 8)}…${reference.slice(-6)}`;
}

function TableShell({ children }: { children: ReactNode }) {
    return <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-card">{children}</div>;
}

function EmptyTableRow({ colSpan }: { colSpan: number }) {
    const { t } = useClientTranslations();
    return <tr><td colSpan={colSpan} className="p-8 text-center text-sm text-muted-foreground">{t("common.noResults")}</td></tr>;
}

function PageFooter({ page }: { page: { currentPage: number; totalPages: number; totalItems: number } }) {
    const { t } = useClientTranslations();
    const { goToPage, isPending } = useTableQueryState();
    if (page.totalPages <= 1) return null;
    return (
        <div className="flex flex-col items-center justify-between gap-3 pt-3 text-sm text-muted-foreground sm:flex-row">
            <span>{page.totalItems} {t("common.rows")}</span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={isPending || page.currentPage <= 1} onClick={() => goToPage(page.currentPage - 1)}>{t("common.previous")}</Button>
                <span>{t("common.page")} {page.currentPage} {t("common.of")} {page.totalPages}</span>
                <Button variant="outline" size="sm" disabled={isPending || page.currentPage >= page.totalPages} onClick={() => goToPage(page.currentPage + 1)}>{t("common.next")}</Button>
            </div>
        </div>
    );
}

const TYPES_MOUVEMENT = [
    "RECEPTION_CLIENT", "ANNULATION_RECEPTION", "SORTIE_VENTE", "PRET_AGRICULTEUR",
    "RETOUR_AGRICULTEUR", "ANNULATION_RETOUR_AGRICULTEUR", "AJUSTEMENT",
] as const;

function StockFilters({ clients, typesCaisses }: {
    clients: Array<{ id: string; nom: string }>;
    typesCaisses: Array<{ id: string; nom: string }>;
}) {
    const { t } = useClientTranslations();
    const searchParams = useSearchParams();
    const { searchDraft, setSearchDraft, setParams, isPending } = useTableQueryState({ navigationDelayMs: 180 });
    const all = "tous";
    const clientId = searchParams.get("clientId") ?? all;
    const typeCaisseId = searchParams.get("typeCaisseId") ?? all;
    const proprietaire = searchParams.get("proprietaire") ?? all;
    const typeMouvement = searchParams.get("typeMouvement") ?? all;
    const from = searchParams.get("from") ?? "";
    const to = searchParams.get("to") ?? "";
    const fromDate = from ? parseISO(from) : undefined;
    const toDate = to ? parseISO(to) : undefined;
    const dateRange: DateRange | undefined = fromDate && isValid(fromDate)
        ? { from: fromDate, to: toDate && isValid(toDate) ? toDate : undefined }
        : undefined;
    const actif = !!searchDraft || clientId !== all || typeCaisseId !== all || proprietaire !== all || typeMouvement !== all || !!from || !!to;

    return (
        <div aria-busy={isPending} className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div className="relative sm:col-span-2">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder={t("common.search")} className="ps-9" />
            </div>
            <Select value={clientId} onValueChange={(value) => setParams({ clientId: value === all ? "" : value })}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("caisseStock.client")} /></SelectTrigger>
                <SelectContent><SelectItem value={all}>{t("common.all")}</SelectItem>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={typeCaisseId} onValueChange={(value) => setParams({ typeCaisseId: value === all ? "" : value })}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("caisseStock.crateType")} /></SelectTrigger>
                <SelectContent><SelectItem value={all}>{t("common.all")}</SelectItem>{typesCaisses.map((type) => <SelectItem key={type.id} value={type.id}>{type.nom}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={proprietaire} onValueChange={(value) => setParams({ proprietaire: value === all ? "" : value })}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("caisseStock.owner")} /></SelectTrigger>
                <SelectContent><SelectItem value={all}>{t("common.all")}</SelectItem><SelectItem value="WAKALA">Wakala</SelectItem><SelectItem value="CLIENT">{t("caisseStock.client")}</SelectItem></SelectContent>
            </Select>
            <Select value={typeMouvement} onValueChange={(value) => setParams({ typeMouvement: value === all ? "" : value })}>
                <SelectTrigger className="w-full"><SelectValue placeholder={t("caisseStock.movement")} /></SelectTrigger>
                <SelectContent><SelectItem value={all}>{t("common.all")}</SelectItem>{TYPES_MOUVEMENT.map((type) => <SelectItem key={type} value={type}>{t(`caisseStock.movementTypes.${type}`)}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex min-w-0 gap-2 sm:col-span-2 lg:col-span-2 xl:col-span-2">
                <DateRangePicker
                    value={dateRange}
                    onChange={(range) => setParams({
                        from: range?.from ? format(range.from, "yyyy-MM-dd") : "",
                        to: range?.to ? format(range.to, "yyyy-MM-dd") : "",
                    })}
                    placeholder={t("dashboard.filters.dateRange")}
                    commitMode="apply"
                    applyLabel={t("dashboard.filters.apply")}
                    clearLabel={t("common.reset")}
                    className="min-w-0 flex-1 sm:w-full"
                />
                {actif && <Button variant="outline" size="icon" disabled={isPending} onClick={() => { setSearchDraft(""); setParams({ search: "", clientId: "", typeCaisseId: "", proprietaire: "", typeMouvement: "", from: "", to: "" }); }} aria-label={t("common.resetFilters")}><X className="h-4 w-4" /></Button>}
            </div>
        </div>
    );
}

function ReceptionDialog({ clients, typesCaisses }: { clients: Array<{ id: string; nom: string }>; typesCaisses: Array<{ id: string; nom: string }> }) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [clientId, setClientId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [matriculeCamion, setMatriculeCamion] = useState("");
    const [chauffeur, setChauffeur] = useState("");
    const [observations, setObservations] = useState("");
    const [lignes, setLignes] = useState<LigneReception[]>([{ typeCaisseId: "", quantite: 1 }]);

    const submit = async () => {
        setPending(true);
        const result = await createReceptionCaissesAction({ clientId, date, matriculeCamion, chauffeur, observations, lignes });
        setPending(false);
        if (!result.success) return toast.error(result.error);
        toast.success(t("caisseStock.receptionCreated", { numero: result.data.numero }));
        setOpen(false);
        setClientId("");
        setLignes([{ typeCaisseId: "", quantite: 1 }]);
        router.refresh();
    };

    const valide = clientId && lignes.length > 0 && lignes.every((ligne) => ligne.typeCaisseId && ligne.quantite > 0);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />{t("caisseStock.newReception")}</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden p-3 sm:w-full sm:max-w-[calc(100%-2rem)] sm:p-5 md:max-w-2xl">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle>{t("caisseStock.receptionTitle")}</DialogTitle>
                    <DialogDescription>{t("caisseStock.receptionDescription")}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                        <Label>{t("caisseStock.client")} *</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={t("caisseStock.selectClient")} /></SelectTrigger>
                            <SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>{t("caisseStock.date")} *</Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
                    <div className="space-y-2"><Label>{t("caisseStock.truckRegistration")}</Label><Input value={matriculeCamion} onChange={(event) => setMatriculeCamion(event.target.value)} /></div>
                    <div className="space-y-2 sm:col-span-2"><Label>{t("caisseStock.driver")}</Label><Input value={chauffeur} onChange={(event) => setChauffeur(event.target.value)} /></div>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between"><Label>{t("caisseStock.crateLines")} *</Label><Button type="button" size="sm" variant="outline" onClick={() => setLignes((current) => [...current, { typeCaisseId: "", quantite: 1 }])}><Plus className="h-4 w-4" />{t("caisseStock.line")}</Button></div>
                    {lignes.map((ligne, index) => (
                        <div key={index} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-lg border border-border bg-muted/35 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
                            <div className="col-span-2 min-w-0 sm:col-span-1"><Select value={ligne.typeCaisseId} onValueChange={(value) => setLignes((current) => current.map((item, i) => i === index ? { ...item, typeCaisseId: value } : item))}>
                                <SelectTrigger className="w-full min-w-0 bg-card"><SelectValue placeholder={t("caisseStock.crateType")} /></SelectTrigger>
                                <SelectContent>{typesCaisses.map((type) => <SelectItem key={type.id} value={type.id} disabled={lignes.some((item, i) => i !== index && item.typeCaisseId === type.id)}>{type.nom}</SelectItem>)}</SelectContent>
                            </Select></div>
                            <Input type="number" min={1} step={1} value={ligne.quantite} onChange={(event) => setLignes((current) => current.map((item, i) => i === index ? { ...item, quantite: Number(event.target.value) } : item))} />
                            <Button type="button" variant="ghost" size="icon" disabled={lignes.length === 1} onClick={() => setLignes((current) => current.filter((_, i) => i !== index))} aria-label="Retirer la ligne"><RotateCcw className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
                <div className="space-y-2"><Label>{t("caisseStock.observations")}</Label><Textarea value={observations} onChange={(event) => setObservations(event.target.value)} /></div>
                <DialogFooter><Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button className="w-full sm:w-auto" disabled={!valide || pending} onClick={submit}>{pending ? t("common.loading") : t("caisseStock.validateReception")}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReceptionDetailsDialog({ reception, branding }: { reception: ReceptionRow; branding?: PdfBranding }) {
    const { t, locale } = useClientTranslations();
    const total = reception.Lignes.reduce((sum, ligne) => sum + ligne.quantite, 0);

    return (
        <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="ghost"><Eye className="h-4 w-4" />{t("common.view")}</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden p-3 sm:w-full sm:max-w-xl sm:p-5">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle>{t("caisseStock.receptionDetails")} · {reception.numero}</DialogTitle>
                    <DialogDescription>{reception.Client.nom} · {new Date(reception.date).toLocaleDateString(locale)}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">{t("caisseStock.truckRegistration")}</p><p className="font-medium text-foreground">{reception.matriculeCamion || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("caisseStock.driver")}</p><p className="font-medium text-foreground">{reception.chauffeur || "—"}</p></div>
                    <div><p className="text-xs text-muted-foreground">{t("caisseStock.statusLabel")}</p><Badge variant={reception.statut === "VALIDEE" ? "default" : "destructive"}>{t(`caisseStock.status.${reception.statut}`)}</Badge></div>
                    <div><p className="text-xs text-muted-foreground">{t("common.total")}</p><p className="font-bold text-foreground">{total.toLocaleString(locale)} {t("caisseStock.crates")}</p></div>
                </div>
                <TableShell>
                    <table className="w-full text-sm">
                        <thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3 text-start">{t("caisseStock.crateType")}</th><th className="p-3 text-end">{t("common.total")}</th></tr></thead>
                        <tbody>{reception.Lignes.map((ligne, index) => <tr key={`${ligne.TypeCaisse.nom}-${index}`} className="border-t border-border"><td className="p-3 font-medium">{ligne.TypeCaisse.nom}</td><td className="p-3 text-end font-bold">{ligne.quantite.toLocaleString(locale)}</td></tr>)}</tbody>
                    </table>
                </TableShell>
                {reception.observations && <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{t("caisseStock.observations")}</p><p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{reception.observations}</p></div>}
                <DialogFooter><Button className="w-full sm:w-auto" onClick={() => downloadReceptionCaissesPDF(reception, branding)}><PackageCheck className="h-4 w-4" />{t("caisseStock.print")}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CancelReceptionDialog({ receptionId, onCancelled }: { receptionId: string; onCancelled: () => void }) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [motif, setMotif] = useState("");

    const submit = async () => {
        const reason = motif.trim();
        if (!reason) return;
        setPending(true);
        const result = await cancelReceptionCaissesAction({ receptionId, motif: reason });
        setPending(false);
        if (!result.success) return toast.error(result.error);
        toast.success(t("caisseStock.receptionCancelled"));
        setOpen(false);
        setMotif("");
        onCancelled();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline">{t("caisseStock.cancelReception")}</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden p-3 sm:w-full sm:max-w-md sm:p-5">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle>{t("caisseStock.cancelReception")}</DialogTitle>
                    <DialogDescription>{t("caisseStock.cancelReceptionDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2"><Label htmlFor={`cancel-reception-${receptionId}`}>{t("caisseStock.cancelReason")}</Label><Textarea id={`cancel-reception-${receptionId}`} value={motif} onChange={(event) => setMotif(event.target.value)} /></div>
                <DialogFooter><Button className="w-full sm:w-auto" variant="outline" onClick={() => setOpen(false)}>{t("common.close")}</Button><Button className="w-full sm:w-auto" variant="destructive" disabled={pending || !motif.trim()} onClick={submit}>{pending ? t("common.loading") : t("caisseStock.confirmCancellation")}</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AdjustWakalaStockDialog({ typeCaisse, onOptimisticChange, onCommitted }: {
    typeCaisse: StockOverview["parType"][number];
    onOptimisticChange: (nouvelleQuantite: number) => void;
    onCommitted: () => void;
}) {
    const { t, locale } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [quantite, setQuantite] = useState(String(typeCaisse.quantiteWakala));
    const [motif, setMotif] = useState("");
    const nouvelleQuantite = Number(quantite);
    const quantiteValide = quantite.trim() !== "" && Number.isInteger(nouvelleQuantite) && nouvelleQuantite >= 0;
    const difference = quantiteValide ? nouvelleQuantite - typeCaisse.quantiteWakala : 0;

    const changeOpen = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            setQuantite(String(typeCaisse.quantiteWakala));
            setMotif("");
        }
    };

    const submit = async () => {
        if (!quantiteValide || difference === 0 || motif.trim().length < 3) return;
        setPending(true);
        onOptimisticChange(nouvelleQuantite);
        setOpen(false);
        try {
            const result = await adjustWakalaStockAction({
                typeCaisseId: typeCaisse.id,
                nouvelleQuantite,
                motif: motif.trim(),
            });
            if (!result.success) {
                onOptimisticChange(typeCaisse.quantiteWakala);
                toast.error(result.error);
                return;
            }
            toast.success(t("caisseStock.stockAdjusted", { type: typeCaisse.nom }));
            onCommitted();
        } catch {
            onOptimisticChange(typeCaisse.quantiteWakala);
            toast.error(t("messages.error.generic"));
        } finally {
            setPending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full gap-2 sm:w-auto" disabled={pending}>
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("caisseStock.adjustStock")}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-0.75rem)] max-w-none overflow-x-hidden p-3 sm:w-full sm:max-w-lg sm:p-5">
                <DialogHeader className="min-w-0 pe-8">
                    <DialogTitle>{t("caisseStock.manageWakalaStock")}</DialogTitle>
                    <DialogDescription>{t("caisseStock.wakalaStockDescription", { type: typeCaisse.nom })}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 rounded-xl border border-border bg-muted/35 p-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs text-muted-foreground">{t("caisseStock.crateType")}</p>
                        <p className="font-semibold text-foreground">{typeCaisse.nom}</p>
                        <p className="text-xs text-muted-foreground">{t("caisseStock.tare")} {typeCaisse.poidsKg} kg</p>
                    </div>
                    <div className="sm:text-end">
                        <p className="text-xs text-muted-foreground">{t("caisseStock.currentQuantity")}</p>
                        <p className="text-2xl font-bold text-foreground">
                            {typeCaisse.quantiteWakala.toLocaleString(locale)} <span className="text-sm font-medium">{t("caisseStock.crates")}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`wakala-stock-${typeCaisse.id}`}>{t("caisseStock.newQuantity")} *</Label>
                    <Input
                        id={`wakala-stock-${typeCaisse.id}`}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={quantite}
                        onChange={(event) => setQuantite(event.target.value)}
                    />
                    {quantiteValide && (
                        <p className={`text-xs font-medium ${difference > 0 ? "text-emerald-600 dark:text-emerald-400" : difference < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                            {difference === 0
                                ? t("caisseStock.unchangedQuantity")
                                : t("caisseStock.adjustmentDifference", { value: `${difference > 0 ? "+" : ""}${difference.toLocaleString(locale)}` })}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`wakala-stock-reason-${typeCaisse.id}`}>{t("caisseStock.adjustmentReason")} *</Label>
                    <Textarea
                        id={`wakala-stock-reason-${typeCaisse.id}`}
                        value={motif}
                        onChange={(event) => setMotif(event.target.value)}
                        placeholder={t("caisseStock.adjustmentReasonPlaceholder")}
                        maxLength={500}
                    />
                </div>

                <DialogFooter>
                    <Button className="w-full sm:w-auto" type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                    <Button className="w-full sm:w-auto" type="button" disabled={pending || !quantiteValide || difference === 0 || motif.trim().length < 3} onClick={submit}>
                        {pending ? t("common.loading") : t("common.save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function StockCaissesWorkspace({ overview: serverOverview, stocksClients, receptions, mouvements, clients, typesCaisses, pretsContent, branding, permissions }: {
    overview: StockOverview;
    stocksClients: PageResult<StockClientRow>;
    receptions: PageResult<ReceptionRow>;
    mouvements: PageResult<MouvementRow>;
    clients: Array<{ id: string; nom: string }>;
    typesCaisses: Array<{ id: string; nom: string }>;
    pretsContent: ReactNode;
    branding?: PdfBranding;
    permissions: { canCreateReception: boolean; canCancelReception: boolean; canReadMovements: boolean; canAdjustStock: boolean };
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, locale } = useClientTranslations();
    const { setParams } = useTableQueryState();
    const [overview, setOverview] = useState(serverOverview);
    const requestedTab = searchParams.get("tab") ?? "overview";
    const activeTab = requestedTab === "mouvements" && !permissions.canReadMovements ? "overview" : requestedTab;

    const changeTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab === "overview") params.delete("tab");
        else params.set("tab", tab);
        const query = params.toString();
        window.history.replaceState(null, "", query ? "?" + query : window.location.pathname);
    };

    const applyWakalaAdjustment = (typeCaisseId: string, nouvelleQuantite: number) => {
        setOverview((current) => {
            const type = current.parType.find((item) => item.id === typeCaisseId);
            if (!type) return current;
            const difference = nouvelleQuantite - type.quantiteWakala;
            if (difference === 0) return current;
            return {
                kpis: {
                    ...current.kpis,
                    stockPhysique: current.kpis.stockPhysique + difference,
                    stockWakala: current.kpis.stockWakala + difference,
                },
                parType: current.parType.map((item) => item.id === typeCaisseId
                    ? {
                        ...item,
                        quantiteWakala: nouvelleQuantite,
                        quantiteTotale: item.quantiteTotale + difference,
                    }
                    : item),
            };
        });
    };

    const refreshInBackground = () => {
        startTransition(() => router.refresh());
    };
    const kpis = [
        { label: t("caisseStock.physicalStock"), value: overview.kpis.stockPhysique, icon: Boxes, tone: "text-amber-600 dark:text-amber-300" },
        { label: t("caisseStock.wakalaCrates"), value: overview.kpis.stockWakala, icon: Building2, tone: "text-emerald-600 dark:text-emerald-300" },
        { label: t("caisseStock.clientCrates"), value: overview.kpis.stockClients, icon: UsersRound, tone: "text-sky-600 dark:text-sky-300" },
        { label: t("caisseStock.openLoans"), value: overview.kpis.pretsEnCours, icon: Truck, tone: "text-orange-600 dark:text-orange-300" },
    ];

    return (
        <div className="min-w-0 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon, tone }) => <div key={label} className="dashboard-card min-w-0 rounded-xl border p-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><Icon className={`h-5 w-5 ${tone}`} /></span><div className="min-w-0"><p className="truncate text-xs text-muted-foreground" title={label}>{label}</p><p className="break-words text-2xl font-bold text-foreground">{value.toLocaleString(locale)} <span className="text-sm font-medium">{t("caisseStock.crates")}</span></p></div></div></div>)}
            </div>

            <StockFilters clients={clients} typesCaisses={typesCaisses} />

            <Tabs value={activeTab} onValueChange={changeTab} className="space-y-4">
                <TabsList className="h-auto w-full max-w-full justify-start overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-card p-1">
                    <TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="overview">{t("caisseStock.tabs.overview")}</TabsTrigger><TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="wakala">{t("caisseStock.tabs.wakala")}</TabsTrigger><TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="clients">{t("caisseStock.tabs.clients")}</TabsTrigger><TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="receptions">{t("caisseStock.tabs.receptions")}</TabsTrigger><TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="prets">{t("caisseStock.tabs.loans")}</TabsTrigger>{permissions.canReadMovements && <TabsTrigger className="min-w-max flex-none lg:min-w-0 lg:flex-1" value="mouvements">{t("caisseStock.tabs.movements")}</TabsTrigger>}
                </TabsList>
                <TabsContent value="overview">
                    <TableShell><table className="w-full text-sm"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3 text-start">{t("caisseStock.crateType")}</th><th className="p-3 text-end">{t("caisseStock.physical")}</th><th className="p-3 text-end">Wakala</th><th className="p-3 text-end">{t("caisseStock.clients")}</th></tr></thead><tbody>{overview.parType.length === 0 ? <EmptyTableRow colSpan={4} /> : overview.parType.map((type) => <tr key={type.id} className="border-t border-border hover:bg-muted/35"><td className="p-3 font-medium">{type.nom}<p className="text-xs font-normal text-muted-foreground">{t("caisseStock.tare")} {type.poidsKg} kg</p></td><td className="p-3 text-end font-bold">{type.quantiteTotale}</td><td className="p-3 text-end">{type.quantiteWakala}</td><td className="p-3 text-end"><span>{type.quantiteClients}</span>{type.proprietairesClients.length > 0 && <div className="mt-1 space-y-0.5 text-xs font-normal text-muted-foreground">{type.proprietairesClients.map((owner) => <div key={owner.clientId}>{owner.client}: {owner.quantite}</div>)}</div>}</td></tr>)}</tbody></table></TableShell>
                    <div className="mt-5">{pretsContent}</div>
                </TabsContent>
                <TabsContent value="wakala" className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></span>
                            <div className="min-w-0">
                                <h2 className="font-semibold text-foreground">{t("caisseStock.manageWakalaStock")}</h2>
                                <p className="text-sm text-muted-foreground">{t("caisseStock.wakalaStockManagementHint")}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="w-fit whitespace-nowrap px-3 py-1 text-sm">
                            {overview.kpis.stockWakala.toLocaleString(locale)} {t("caisseStock.crates")}
                        </Badge>
                    </div>

                    <div className="grid gap-3 md:hidden">
                        {overview.parType.length === 0
                            ? <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t("common.noResults")}</div>
                            : overview.parType.map((type) => (
                                <article key={type.id} className="rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground">{type.nom}</h3>
                                            <p className="text-xs text-muted-foreground">{t("caisseStock.tare")} {type.poidsKg} kg</p>
                                        </div>
                                        <p className="shrink-0 text-xl font-bold text-foreground">{type.quantiteWakala.toLocaleString(locale)}</p>
                                    </div>
                                    {permissions.canAdjustStock && <div className="mt-4"><AdjustWakalaStockDialog typeCaisse={type} onOptimisticChange={(quantity) => applyWakalaAdjustment(type.id, quantity)} onCommitted={refreshInBackground} /></div>}
                                </article>
                            ))}
                    </div>

                    <div className="hidden md:block">
                        <TableShell>
                            <table className="w-full min-w-[620px] text-sm">
                                <thead className="bg-muted/60 text-muted-foreground">
                                    <tr>
                                        <th className="p-3 text-start">{t("caisseStock.crateType")}</th>
                                        <th className="p-3 text-end">{t("caisseStock.tare")}</th>
                                        <th className="p-3 text-end">{t("caisseStock.wakalaQuantity")}</th>
                                        {permissions.canAdjustStock && <th className="p-3 text-end">{t("common.actions")}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {overview.parType.length === 0
                                        ? <EmptyTableRow colSpan={permissions.canAdjustStock ? 4 : 3} />
                                        : overview.parType.map((type) => (
                                            <tr key={type.id} className="border-t border-border transition-colors hover:bg-muted/35">
                                                <td className="p-3 font-semibold text-foreground">{type.nom}</td>
                                                <td className="p-3 text-end text-muted-foreground">{type.poidsKg} kg</td>
                                                <td className="p-3 text-end text-lg font-bold text-foreground">{type.quantiteWakala.toLocaleString(locale)}</td>
                                                {permissions.canAdjustStock && <td className="p-3 text-end"><AdjustWakalaStockDialog typeCaisse={type} onOptimisticChange={(quantity) => applyWakalaAdjustment(type.id, quantity)} onCommitted={refreshInBackground} /></td>}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </TableShell>
                    </div>
                </TabsContent>
                <TabsContent value="clients"><TableShell><table className="w-full text-sm"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3 text-start">{t("caisseStock.client")}</th><th className="p-3 text-start">{t("caisseStock.crateType")}</th><th className="p-3 text-end">{t("caisseStock.brought")}</th><th className="p-3 text-end">{t("caisseStock.outgoing")}</th><th className="p-3 text-end">{t("caisseStock.balance")}</th><th className="p-3 text-start">{t("caisseStock.lastMovement")}</th>{permissions.canReadMovements && <th className="p-3 text-end">{t("common.actions")}</th>}</tr></thead><tbody>{stocksClients.items.length === 0 ? <EmptyTableRow colSpan={permissions.canReadMovements ? 7 : 6} /> : stocksClients.items.map((stock) => <tr key={stock.id} className="border-t border-border hover:bg-muted/35"><td className="p-3 font-medium">{stock.Client.nom}</td><td className="p-3">{stock.TypeCaisse.nom}</td><td className="p-3 text-end text-emerald-600">{stock.totalEntrees}</td><td className="p-3 text-end text-red-600">{stock.totalSorties}</td><td className="p-3 text-end font-bold">{stock.quantite}</td><td className="p-3 text-xs text-muted-foreground">{stock.dernierMouvement ? `${t(`caisseStock.movementTypes.${stock.dernierMouvement.type}`)} · ${new Date(stock.dernierMouvement.createdAt).toLocaleDateString(locale)}` : "—"}</td>{permissions.canReadMovements && <td className="p-3 text-end"><Button variant="ghost" size="sm" onClick={() => setParams({ tab: "mouvements", clientId: stock.clientId, typeCaisseId: stock.typeCaisseId })}><Eye className="h-4 w-4" />{t("common.view")}</Button></td>}</tr>)}</tbody></table></TableShell><PageFooter page={stocksClients} /></TabsContent>
                <TabsContent value="receptions" className="space-y-3">{permissions.canCreateReception && <div className="flex justify-end"><ReceptionDialog clients={clients} typesCaisses={typesCaisses} /></div>}<TableShell><table className="w-full text-sm"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3 text-start">{t("caisseStock.number")}</th><th className="p-3 text-start">{t("caisseStock.date")}</th><th className="p-3 text-start">{t("caisseStock.client")}</th><th className="p-3 text-start">{t("caisseStock.truck")}</th><th className="p-3 text-end">{t("common.total")}</th><th className="p-3 text-end">{t("common.actions")}</th></tr></thead><tbody>{receptions.items.length === 0 ? <EmptyTableRow colSpan={6} /> : receptions.items.map((reception) => <tr key={reception.id} className="border-t border-border hover:bg-muted/35"><td className="p-3 font-medium">{reception.numero}<div><Badge variant={reception.statut === "VALIDEE" ? "default" : "destructive"}>{t(`caisseStock.status.${reception.statut}`)}</Badge></div></td><td className="p-3">{new Date(reception.date).toLocaleDateString(locale)}</td><td className="p-3">{reception.Client.nom}</td><td className="p-3">{reception.matriculeCamion || "—"}<p className="text-xs text-muted-foreground">{reception.chauffeur}</p></td><td className="p-3 text-end font-bold">{reception.Lignes.reduce((sum, ligne) => sum + ligne.quantite, 0)}</td><td className="p-3"><div className="flex flex-wrap justify-end gap-2"><ReceptionDetailsDialog reception={reception} branding={branding} /><Button size="sm" variant="outline" onClick={() => downloadReceptionCaissesPDF(reception, branding)}><PackageCheck className="h-4 w-4" />{t("caisseStock.print")}</Button>{permissions.canCancelReception && reception.statut === "VALIDEE" && <CancelReceptionDialog receptionId={reception.id} onCancelled={() => router.refresh()} />}</div></td></tr>)}</tbody></table></TableShell><PageFooter page={receptions} /></TabsContent>
                <TabsContent value="prets">{pretsContent}</TabsContent>
                <TabsContent value="mouvements"><div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><History className="h-4 w-4" />{t("caisseStock.readOnlyLedger")}</div><TableShell><table className="w-full text-sm"><thead className="bg-muted/60 text-muted-foreground"><tr><th className="p-3 text-start">{t("caisseStock.date")}</th><th className="p-3 text-start">{t("caisseStock.crateType")}</th><th className="p-3 text-start">{t("caisseStock.movement")}</th><th className="p-3 text-start">{t("caisseStock.owner")}</th><th className="p-3 text-end">{t("caisseStock.inOut")}</th><th className="p-3 text-start">{t("caisseStock.document")}</th><th className="p-3 text-start">{t("caisseStock.user")}</th></tr></thead><tbody>{mouvements.items.length === 0 ? <EmptyTableRow colSpan={7} /> : mouvements.items.map((mouvement) => <tr key={mouvement.id} className="border-t border-border hover:bg-muted/35"><td className="p-3">{new Date(mouvement.createdAt).toLocaleString(locale)}</td><td className="p-3">{mouvement.TypeCaisse.nom}</td><td className="p-3"><Badge variant="outline">{t(`caisseStock.movementTypes.${mouvement.type}`)}</Badge></td><td className="p-3">{mouvement.proprietaire === "WAKALA" ? "Wakala" : mouvement.ClientProprietaire?.nom}</td><td className={`p-3 text-end font-bold ${mouvement.direction === "ENTREE" ? "text-emerald-600" : "text-red-600"}`}>{mouvement.direction === "ENTREE" ? "+" : "−"}{mouvement.quantite}</td><td className="p-3" title={mouvement.reference ?? undefined}><span className="block font-medium text-foreground">{t(`caisseStock.movementTypes.${mouvement.type}`)}</span><span className="font-mono text-xs text-muted-foreground">{referenceLisible(mouvement.reference)}</span></td><td className="p-3">{mouvement.CreatedBy?.name || "—"}</td></tr>)}</tbody></table></TableShell><PageFooter page={mouvements} /></TabsContent>
            </Tabs>
        </div>
    );
}
