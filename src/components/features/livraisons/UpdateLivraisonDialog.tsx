"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateLivraisonAvecPeseesAction } from "@/actions/livraisons/update-livraison-avec-pesees.action";
import { getLivraisonByIdAction } from "@/actions/livraisons/get-livraison-by-id.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesDatesAction } from "@/actions/types-dates/get-types-dates.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Agriculteur = { id: string; label: string };
type TypeDate = { id: string; nom: string };
type TypeCaisse = { id: string; nom: string; poidsKg: number };

type LigneWizard = {
    clientId: string;
    typeDateId: string;
    typeCaisseId: string;
    nombreCaisses: number;
    poidsBrutTotal: number;
    prixKg: number;
    quantiteAcceptee: number | null;
};

type UpdateLivraisonDialogProps = {
    livraison: {
        id: string;
        dateLivraison: Date;
    };
};

function nextClientId() {
    return Math.random().toString(36).substring(2, 9);
}

function ligneVierge(defaultPrixKg = 0): LigneWizard {
    return {
        clientId: nextClientId(),
        typeDateId: "",
        typeCaisseId: "",
        nombreCaisses: 1,
        poidsBrutTotal: 0,
        prixKg: defaultPrixKg,
        quantiteAcceptee: null,
    };
}

export function UpdateLivraisonDialog({ livraison }: UpdateLivraisonDialogProps) {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingLivraison, setLoadingLivraison] = useState(false);

    const [agriculteurs, setAgriculteurs] = useState<Agriculteur[]>([]);
    const [typesDates, setTypesDates] = useState<TypeDate[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<TypeCaisse[]>([]);

    const [agriculteurId, setAgriculteurId] = useState("");
    const [dateLivraison, setDateLivraison] = useState(
        livraison.dateLivraison.toISOString().split("T")[0]
    );
    const [lignes, setLignes] = useState<LigneWizard[]>([ligneVierge()]);
    const [observations, setObservations] = useState("");

    async function loadReferenceData() {
        const [agriResult, datesResult, caissesResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesDatesAction(),
            getTypesCaissesAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (datesResult.success) setTypesDates(datesResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
    }

    async function loadLivraison() {
        setLoadingLivraison(true);
        const result = await getLivraisonByIdAction(livraison.id);
        setLoadingLivraison(false);

        if (!result.success || !result.data) {
            toast.error(result.error || t("messages.error.generic"));
            return;
        }

        const data = result.data as any;
        setAgriculteurId(data.agriculteurId || data.agriculteur?.id || "");
        setDateLivraison(new Date(data.dateLivraison).toISOString().split("T")[0]);
        setObservations(data.bonAchat?.observations ?? "");

        const prixKgMoyenExistant = data.bonAchat?.prixKg ?? 0;

        const pesees = (data.pesees || []) as Array<{
            typeCaisseId: string;
            typeDateId: string;
            nombreCaisses: number;
            poidsBrutTotal: number;
            prixKg: number;
            quantiteAcceptee: number;
        }>;

        setLignes(
            pesees.length > 0
                ? pesees.map((p) => ({
                    clientId: nextClientId(),
                    typeDateId: p.typeDateId,
                    typeCaisseId: p.typeCaisseId,
                    nombreCaisses: p.nombreCaisses,
                    poidsBrutTotal: p.poidsBrutTotal,
                    prixKg: p.prixKg > 0 ? p.prixKg : prixKgMoyenExistant,
                    quantiteAcceptee: p.quantiteAcceptee,
                }))
                : [ligneVierge()]
        );
    }

    useEffect(() => {
        if (open) {
            loadReferenceData();
            loadLivraison();
        }
    }, [open]);

    function tareFor(typeCaisseId: string) {
        return typesCaisses.find((tc) => tc.id === typeCaisseId)?.poidsKg ?? 0;
    }

    function updateLigne(clientId: string, patch: Partial<LigneWizard>) {
        setLignes((prev) => prev.map((l) => (l.clientId === clientId ? { ...l, ...patch } : l)));
    }

    function addLigne() {
        setLignes((prev) => [...prev, ligneVierge()]);
    }

    function removeLigne(clientId: string) {
        setLignes((prev) => (prev.length > 1 ? prev.filter((l) => l.clientId !== clientId) : prev));
    }

    const ligneTotals = useMemo(() => {
        return lignes.map((ligne) => {
            const tare = typesCaisses.find((tc) => tc.id === ligne.typeCaisseId)?.poidsKg ?? 0;
            const nombreCaisses = Number(ligne.nombreCaisses) || 0;
            const poidsBrutTotal = Number(ligne.poidsBrutTotal) || 0;
            const poidsTareTotal = tare * nombreCaisses;
            const poidsNetTotal = poidsBrutTotal - poidsTareTotal;
            const prixKg = Number(ligne.prixKg) || 0;
            const quantiteAcceptee =
                ligne.quantiteAcceptee !== null && Number.isFinite(ligne.quantiteAcceptee)
                    ? ligne.quantiteAcceptee
                    : Math.max(poidsNetTotal, 0);
            const montant = quantiteAcceptee > 0 ? quantiteAcceptee * prixKg : 0;
            return { poidsBrutTotal, poidsTareTotal, poidsNetTotal, tare, quantiteAcceptee, montant };
        });
    }, [lignes, typesCaisses]);

    const grandTotalNet = ligneTotals.reduce((sum, lt) => sum + lt.poidsNetTotal, 0);
    const grandTotalAcceptee = ligneTotals.reduce((sum, lt) => sum + lt.quantiteAcceptee, 0);
    const montant = ligneTotals.reduce((sum, lt) => sum + lt.montant, 0);

    const hasDuplicatePairs = useMemo(() => {
        const keys = lignes.map((l) => `${l.typeCaisseId}::${l.typeDateId}`);
        return new Set(keys).size !== keys.length;
    }, [lignes]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!agriculteurId) {
            toast.error(t("nouvellePesee.agriculteurRequired"));
            return;
        }

        for (const ligne of lignes) {
            if (
                !ligne.typeDateId ||
                !ligne.typeCaisseId ||
                !Number.isFinite(ligne.nombreCaisses) ||
                ligne.nombreCaisses <= 0 ||
                !Number.isFinite(ligne.poidsBrutTotal) ||
                ligne.poidsBrutTotal <= 0
            ) {
                toast.error(t("nouvellePesee.ligneIncomplete"));
                return;
            }
            const tare = tareFor(ligne.typeCaisseId);
            const poidsBrutMoyen = ligne.poidsBrutTotal / ligne.nombreCaisses;
            if (poidsBrutMoyen <= tare) {
                toast.error(t("pesees.grossMustExceedTare", { tare: String(tare) }));
                return;
            }
            if (!Number.isFinite(ligne.prixKg) || ligne.prixKg <= 0) {
                toast.error(t("nouvellePesee.prixKgLigneRequired"));
                return;
            }
            const poidsNetTotal = ligne.poidsBrutTotal - tare * ligne.nombreCaisses;
            const quantiteAcceptee = ligne.quantiteAcceptee ?? poidsNetTotal;
            if (!Number.isFinite(quantiteAcceptee) || quantiteAcceptee <= 0 || quantiteAcceptee > poidsNetTotal) {
                toast.error(t("nouvellePesee.quantiteAccepteeRequired"));
                return;
            }
        }

        if (hasDuplicatePairs) {
            toast.error(t("nouvellePesee.duplicateLigne"));
            return;
        }

        setLoading(true);

        const payload = {
            agriculteurId,
            dateLivraison,
            lignes: lignes.map((l) => ({
                typeDateId: l.typeDateId,
                typeCaisseId: l.typeCaisseId,
                quantiteDeclaree: l.nombreCaisses,
                prixKg: l.prixKg,
                quantiteAcceptee: l.quantiteAcceptee ?? undefined,
                caisses: Array.from({ length: l.nombreCaisses }, () => ({
                    poidsBrut: l.poidsBrutTotal / l.nombreCaisses,
                })),
            })),
            observations: observations || undefined,
        };

        const result = await updateLivraisonAvecPeseesAction(livraison.id, payload);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.updated").replace("{entity}", t("livraisons.title")));
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-sm text-[#C17A2B] hover:bg-[#C17A2B]/10 hover:text-[#C17A2B]"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg sm:max-w-190 bg-card max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {t("livraisons.updateDialog")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("livraisons.updateDescription")}
                    </DialogDescription>
                </DialogHeader>

                {loadingLivraison ? (
                    <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        {t("common.loading")}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-foreground">{t("livraisons.agriculteur")}</Label>
                                <Select value={agriculteurId} onValueChange={setAgriculteurId}>
                                    <SelectTrigger className="rounded-sm border-border bg-card">
                                        <SelectValue placeholder={t("livraisons.selectAgriculteur")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card">
                                        {agriculteurs.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">{t("livraisons.dateLivraison")}</Label>
                                <Input
                                    type="date"
                                    value={dateLivraison}
                                    onChange={(e) => setDateLivraison(e.target.value)}
                                    className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-foreground text-base font-semibold">
                                    {t("nouvellePesee.lignes")}
                                </Label>
                                <Button
                                    type="button"
                                    onClick={addLigne}
                                    size="sm"
                                    className="gap-1 rounded-sm bg-[#C17A2B] hover:bg-[#A0621F]"
                                >
                                    <Plus className="h-3 w-3" />
                                    {t("nouvellePesee.addLigne")}
                                </Button>
                            </div>

                            {lignes.map((ligne, ligneIndex) => {
                                const totals = ligneTotals[ligneIndex];
                                return (
                                    <div
                                        key={ligne.clientId}
                                        className="rounded-md border border-border p-3 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 flex-1">
                                                <Select
                                                    value={ligne.typeDateId}
                                                    onValueChange={(value) => updateLigne(ligne.clientId, { typeDateId: value })}
                                                >
                                                    <SelectTrigger className="rounded-sm border-border bg-card">
                                                        <SelectValue placeholder={t("livraisons.selectTypeDate")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card">
                                                        {typesDates.map((td) => (
                                                            <SelectItem key={td.id} value={td.id}>
                                                                {td.nom}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={ligne.typeCaisseId}
                                                    onValueChange={(value) => updateLigne(ligne.clientId, { typeCaisseId: value })}
                                                >
                                                    <SelectTrigger className="rounded-sm border-border bg-card">
                                                        <SelectValue placeholder={t("livraisons.selectTypeCaisse")} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card">
                                                        {typesCaisses.map((tc) => (
                                                            <SelectItem key={tc.id} value={tc.id}>
                                                                {tc.nom} ({t("pesees.tare")}: {tc.poidsKg} kg)
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={ligne.nombreCaisses}
                                                    onChange={(e) =>
                                                        updateLigne(ligne.clientId, { nombreCaisses: Number(e.target.value) || 0 })
                                                    }
                                                    placeholder={t("nouvellePesee.quantiteDeclaree")}
                                                    className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                                />
                                            </div>
                                            {lignes.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLigne(ligne.clientId)}
                                                    className="h-9 w-9 rounded-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 ps-1 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {t("pesees.grossWeightLabel")}
                                                </div>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={ligne.poidsBrutTotal || ""}
                                                    onChange={(e) =>
                                                        updateLigne(ligne.clientId, { poidsBrutTotal: parseFloat(e.target.value) || 0 })
                                                    }
                                                    placeholder={t("pesees.grossWeightLabel")}
                                                    className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="text-xs font-medium text-muted-foreground">
                                                    {t("nouvellePesee.prixKgLigne")}
                                                </div>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={ligne.prixKg || ""}
                                                    onChange={(e) =>
                                                        updateLigne(ligne.clientId, { prixKg: parseFloat(e.target.value) || 0 })
                                                    }
                                                    placeholder={t("nouvellePesee.prixKgLigne")}
                                                    className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 rounded-sm bg-muted p-2 text-sm">
                                            <span className="text-muted-foreground">{t("pesees.poidsNetTotal")}:</span>
                                            <span className="font-semibold text-[#C17A2B]">
                                                {totals.poidsNetTotal.toFixed(2)} kg
                                            </span>
                                        </div>

                                        <div className="space-y-2 ps-1">
                                            <div className="text-xs font-medium text-muted-foreground">
                                                {t("nouvellePesee.quantiteAcceptee")}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={ligne.quantiteAcceptee ?? (totals.poidsNetTotal > 0 ? totals.poidsNetTotal.toFixed(2) : "")}
                                                    onChange={(e) =>
                                                        updateLigne(ligne.clientId, {
                                                            quantiteAcceptee: e.target.value === "" ? null : parseFloat(e.target.value) || 0,
                                                        })
                                                    }
                                                    className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                                                />
                                                {ligne.quantiteAcceptee !== null && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => updateLigne(ligne.clientId, { quantiteAcceptee: null })}
                                                        className="h-9 shrink-0 rounded-sm text-[#C17A2B] hover:bg-[#C17A2B]/10"
                                                    >
                                                        {t("common.reset")}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 rounded-sm bg-muted p-2 text-sm">
                                            <span className="text-muted-foreground">{t("nouvellePesee.montantLigne")}:</span>
                                            <span className="font-semibold text-[#C17A2B]">
                                                {totals.montant.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {hasDuplicatePairs && (
                                <p className="text-xs text-red-600">{t("nouvellePesee.duplicateLigne")}</p>
                            )}
                        </div>

                        <div className="rounded-md bg-muted border border-[#C17A2B] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">
                                    {t("nouvellePesee.grandTotal")}
                                </span>
                                <span className="text-xl font-bold text-[#C17A2B]">
                                    {grandTotalNet.toFixed(2)} kg
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-border pt-3">
                                <span className="text-sm font-medium text-foreground">
                                    {t("nouvellePesee.quantiteAcceptee")}
                                </span>
                                <span className="text-xl font-bold text-[#C17A2B]">
                                    {grandTotalAcceptee.toFixed(2)} kg
                                </span>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">{t("nouvellePesee.montant")}</Label>
                                <div className="rounded-sm border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground">
                                    {montant.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">{t("nouvellePesee.observations")}</Label>
                            <Textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="rounded-md"
                                disabled={loading}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? t("livraisons.updating") : t("common.save")}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
