"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, PackageOpen, Scale, Loader2 } from "lucide-react";
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
import { createLivraisonAvecPeseesAction } from "@/actions/livraisons/create-livraison-avec-pesees.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesDatesAction } from "@/actions/types-dates/get-types-dates.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { getPretsEnCoursAgriculteurAction } from "@/actions/prets-caisses/get-prets-agriculteur.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type Agriculteur = { id: string; label: string };
type TypeDate = { id: string; nom: string };
type TypeCaisse = { id: string; nom: string; poidsKg: number };

type LigneWizard = {
    clientId: string;
    typeDateId: string;
    typeCaisseId: string;
    nombreCaisses: number;
    poidsBrutTotal: number; // poids brut total apporté par l'agriculteur pour cette ligne
};

function nextClientId() {
    return Math.random().toString(36).substring(2, 9);
}

function ligneVierge(): LigneWizard {
    return { clientId: nextClientId(), typeDateId: "", typeCaisseId: "", nombreCaisses: 1, poidsBrutTotal: 0 };
}

export function NouvellePeseeWizard() {
    const { t } = useClientTranslations();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [agriculteurs, setAgriculteurs] = useState<Agriculteur[]>([]);
    const [typesDates, setTypesDates] = useState<TypeDate[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<TypeCaisse[]>([]);

    const [agriculteurId, setAgriculteurId] = useState("");
    const [dateLivraison, setDateLivraison] = useState(new Date().toISOString().split("T")[0]);
    const [lignes, setLignes] = useState<LigneWizard[]>([ligneVierge()]);
    const [prixKg, setPrixKg] = useState(0);
    const [quantiteAcceptee, setQuantiteAcceptee] = useState(0);
    const [quantiteAccepteeTouched, setQuantiteAccepteeTouched] = useState(false);
    const [observations, setObservations] = useState("");

    const [pretsEnCours, setPretsEnCours] = useState<
        { id: string; typeCaisse?: { nom: string }; nombreRestant: number }[]
    >([]);
    const [loadingPrets, setLoadingPrets] = useState(false);

    async function loadData() {
        const [agriResult, datesResult, caissesResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesDatesAction(),
            getTypesCaissesAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (datesResult.success) setTypesDates(datesResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
    }

    function resetForm() {
        setAgriculteurId("");
        setDateLivraison(new Date().toISOString().split("T")[0]);
        setLignes([ligneVierge()]);
        setPrixKg(0);
        setQuantiteAcceptee(0);
        setQuantiteAccepteeTouched(false);
        setObservations("");
    }

    useEffect(() => {
        if (open) {
            loadData();
            resetForm();
        }
    }, [open]);

    useEffect(() => {
        let cancelled = false;
        setLoadingPrets(true);
        const request = agriculteurId
            ? getPretsEnCoursAgriculteurAction(agriculteurId)
            : Promise.resolve({ success: true as const, data: [] as typeof pretsEnCours });
        request.then((result) => {
            if (cancelled) return;
            setPretsEnCours(result.success ? result.data || [] : []);
            setLoadingPrets(false);
        });
        return () => {
            cancelled = true;
        };
    }, [agriculteurId]);

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
            return { poidsBrutTotal, poidsTareTotal, poidsNetTotal, tare };
        });
    }, [lignes, typesCaisses]);

    const grandTotalNet = ligneTotals.reduce((sum, lt) => sum + lt.poidsNetTotal, 0);
    const montant = prixKg * quantiteAcceptee;

    useEffect(() => {
        if (!quantiteAccepteeTouched) {
            setQuantiteAcceptee(grandTotalNet);
        }
    }, [grandTotalNet, quantiteAccepteeTouched]);

    function handleQuantiteAccepteeChange(value: number) {
        setQuantiteAcceptee(value);
        setQuantiteAccepteeTouched(true);
    }

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
        }

        if (hasDuplicatePairs) {
            toast.error(t("nouvellePesee.duplicateLigne"));
            return;
        }

        if (prixKg <= 0) {
            toast.error(t("nouvellePesee.prixKgRequired"));
            return;
        }

        if (!Number.isFinite(quantiteAcceptee) || quantiteAcceptee <= 0) {
            toast.error(t("nouvellePesee.quantiteAccepteeRequired"));
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
                caisses: Array.from({ length: l.nombreCaisses }, () => ({
                    poidsBrut: l.poidsBrutTotal / l.nombreCaisses,
                })),
            })),
            prixKg,
            quantiteAcceptee,
            observations: observations || undefined,
        };

        const result = await createLivraisonAvecPeseesAction(payload);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created", { entity: t("livraisons.title") }));
            setOpen(false);
            router.refresh();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("nouvellePesee.createNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[760px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {t("nouvellePesee.title")}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("nouvellePesee.description")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-[#3D1C00]">{t("livraisons.agriculteur")}</Label>
                            <Select value={agriculteurId} onValueChange={setAgriculteurId}>
                                <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                    <SelectValue placeholder={t("livraisons.selectAgriculteur")} />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {agriculteurs.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[#3D1C00]">{t("livraisons.dateLivraison")}</Label>
                            <Input
                                type="date"
                                value={dateLivraison}
                                onChange={(e) => setDateLivraison(e.target.value)}
                                className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                            />
                        </div>
                    </div>

                    {agriculteurId && !loadingPrets && pretsEnCours.length > 0 && (
                        <div className="rounded-[7px] bg-amber-50 border border-amber-300 p-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                                <PackageOpen className="h-4 w-4" />
                                {t("pretsCaisses.pretEnCours")}
                            </div>
                            <ul className="space-y-1">
                                {pretsEnCours.map((pret) => (
                                    <li key={pret.id} className="flex justify-between text-sm text-amber-900">
                                        <span>{pret.typeCaisse?.nom}</span>
                                        <span className="font-semibold">
                                            {pret.nombreRestant} {t("pretsCaisses.nombreRestant")}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[#3D1C00] text-base font-semibold">
                                {t("nouvellePesee.lignes")}
                            </Label>
                            <Button
                                type="button"
                                onClick={addLigne}
                                size="sm"
                                className="gap-1 rounded-[7px] bg-[#C17A2B] hover:bg-[#A0621F]"
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
                                    className="rounded-[9px] border border-[#C17A2B]/20 p-3 space-y-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 flex-1">
                                            <Select
                                                value={ligne.typeDateId}
                                                onValueChange={(value) => updateLigne(ligne.clientId, { typeDateId: value })}
                                            >
                                                <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                                    <SelectValue placeholder={t("livraisons.selectTypeDate")} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
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
                                                <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                                    <SelectValue placeholder={t("livraisons.selectTypeCaisse")} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
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
                                                className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                            />
                                        </div>
                                        {lignes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLigne(ligne.clientId)}
                                                className="h-9 w-9 rounded-[7px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="space-y-2 pl-1">
                                        <div className="text-xs font-medium text-[#3D1C00]/70">
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
                                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                        />
                                    </div>

                                    <div className="flex justify-between items-center rounded-[7px] bg-[#FAF0DC] p-2 text-sm">
                                        <span className="text-[#3D1C00]/70">{t("pesees.poidsNetTotal")}:</span>
                                        <span className="font-semibold text-[#C17A2B]">
                                            {totals.poidsNetTotal.toFixed(2)} kg
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {hasDuplicatePairs && (
                            <p className="text-xs text-red-600">{t("nouvellePesee.duplicateLigne")}</p>
                        )}
                    </div>

                    <div className="rounded-[9px] bg-[#FAF0DC] border border-[#C17A2B] p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#3D1C00]">
                                {t("nouvellePesee.grandTotal")}
                            </span>
                            <span className="text-xl font-bold text-[#C17A2B]">
                                {grandTotalNet.toFixed(2)} kg
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[#C17A2B]/20 pt-3">
                            <Label className="text-[#3D1C00] shrink-0">
                                {t("nouvellePesee.quantiteAcceptee")}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={quantiteAcceptee || ""}
                                    onChange={(e) => handleQuantiteAccepteeChange(parseFloat(e.target.value) || 0)}
                                    className="w-32 rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white text-right"
                                />
                                {quantiteAccepteeTouched && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setQuantiteAccepteeTouched(false);
                                            setQuantiteAcceptee(grandTotalNet);
                                        }}
                                        className="h-9 rounded-[7px] text-[#C17A2B] hover:bg-[#C17A2B]/10"
                                    >
                                        {t("common.reset")}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-[#3D1C00]">{t("nouvellePesee.prixKg")}</Label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={prixKg || ""}
                                onChange={(e) => setPrixKg(parseFloat(e.target.value) || 0)}
                                className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[#3D1C00]">{t("nouvellePesee.montant")}</Label>
                            <div className="rounded-[7px] border border-[#C17A2B]/20 bg-white px-3 py-2 text-sm font-semibold text-[#3D1C00]">
                                {montant.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("nouvellePesee.observations")}</Label>
                        <Textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-[9px]"
                            disabled={loading}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? t("livraisons.creating") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
