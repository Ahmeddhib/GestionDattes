"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClientTranslations } from "@/hooks/useClientTranslations";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildCreatePeseeSchema, type CreatePeseeInput } from "@/validators/pesee.validator";
import { createPeseeAction } from "@/actions/pesees/create-pesee.action";
import { getLivraisonsAction } from "@/actions/livraisons/get-livraisons.action";
import { getPeseesByLivraisonAction } from "@/actions/pesees/get-pesees-by-livraison.action";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Plus, Loader2, Scale, Trash2 } from "lucide-react";

type LivraisonCaisse = {
    typeCaisseId: string;
    typeDateId: string;
    quantite: number;
    typeCaisse: { id: string; nom: string; poidsKg: number };
    typeDate?: { id: string; nom: string };
};

type Livraison = {
    id: string;
    numeroLot: string;
    agriculteur?: { nom: string; prenom: string };
    caisses: LivraisonCaisse[];
};

function ligneKey(typeCaisseId: string, typeDateId: string) {
    return `${typeCaisseId}::${typeDateId}`;
}

export function CreatePeseeDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [livraisons, setLivraisons] = useState<Livraison[]>([]);
    const [loadingLivraisons, setLoadingLivraisons] = useState(false);
    const [weighedLigneKeys, setWeighedLigneKeys] = useState<Set<string>>(new Set());
    const [tare, setTare] = useState(0);
    const tareRef = useRef(0);
    const router = useRouter();
    const { t } = useClientTranslations();

    const form = useForm<CreatePeseeInput>({
        resolver: ((values, context, options) =>
            zodResolver(buildCreatePeseeSchema(tareRef.current))(values, context, options)) as Resolver<CreatePeseeInput>,
        defaultValues: {
            livraisonId: "",
            typeCaisseId: "",
            typeDateId: "",
            caisses: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "caisses",
    });

    const livraisonId = form.watch("livraisonId");
    const typeCaisseId = form.watch("typeCaisseId");
    const typeDateId = form.watch("typeDateId");
    const caisses = form.watch("caisses");

    const selectedLivraison = livraisons.find((l) => l.id === livraisonId);
    const availableCaisses = selectedLivraison?.caisses ?? [];

    const totals = useMemo(() => {
        const poids = (caisses ?? []).map((c) => Number(c?.poidsBrut) || 0);
        const nombreCaisses = poids.length;
        const poidsBrutTotal = poids.reduce((sum, p) => sum + p, 0);
        const poidsTareTotal = tare * nombreCaisses;
        const poidsNetTotal = poidsBrutTotal - poidsTareTotal;
        return {
            nombreCaisses,
            poidsBrutTotal,
            poidsTareTotal,
            poidsNetTotal,
            poidsBrutMoyen: nombreCaisses > 0 ? poidsBrutTotal / nombreCaisses : 0,
            poidsNetMoyen: nombreCaisses > 0 ? poidsNetTotal / nombreCaisses : 0,
        };
    }, [caisses, tare]);

    useEffect(() => {
        if (open) {
            loadLivraisons();
        } else {
            form.reset({ livraisonId: "", typeCaisseId: "", typeDateId: "", caisses: [] });
            setTare(0);
            tareRef.current = 0;
            setWeighedLigneKeys(new Set());
        }
    }, [open]);

    const loadLivraisons = async () => {
        try {
            setLoadingLivraisons(true);
            const result = await getLivraisonsAction();
            if (result.success && result.data) {
                setLivraisons(result.data as unknown as Livraison[]);
            }
        } catch (error) {
            console.error("Erreur chargement livraisons:", error);
            toast.error(t("messages.error.loadData"));
        } finally {
            setLoadingLivraisons(false);
        }
    };

    const handleLivraisonChange = async (value: string) => {
        form.setValue("livraisonId", value);
        form.setValue("typeCaisseId", "");
        form.setValue("typeDateId", "");
        form.setValue("caisses", []);
        setTare(0);
        tareRef.current = 0;

        const result = await getPeseesByLivraisonAction(value);
        if (result.success && result.data) {
            setWeighedLigneKeys(
                new Set(
                    result.data.map((p: { typeCaisseId: string; typeDateId: string }) =>
                        ligneKey(p.typeCaisseId, p.typeDateId)
                    )
                )
            );
        } else {
            setWeighedLigneKeys(new Set());
        }
    };

    const handleLigneChange = (value: string) => {
        const caisse = availableCaisses.find((c) => ligneKey(c.typeCaisseId, c.typeDateId) === value);
        form.setValue("typeCaisseId", caisse?.typeCaisseId ?? "");
        form.setValue("typeDateId", caisse?.typeDateId ?? "");
        const nextTare = caisse?.typeCaisse.poidsKg ?? 0;
        setTare(nextTare);
        tareRef.current = nextTare;
        form.setValue("caisses", [{ poidsBrut: 0 }]);
    };

    const selectedLigneKey = typeCaisseId && typeDateId ? ligneKey(typeCaisseId, typeDateId) : "";
    const selectedCaisseDeclaree = availableCaisses.find(
        (c) => c.typeCaisseId === typeCaisseId && c.typeDateId === typeDateId
    );
    const estimationKg = selectedCaisseDeclaree
        ? selectedCaisseDeclaree.quantite * selectedCaisseDeclaree.typeCaisse.poidsKg
        : 0;
    const ecartPourcentage =
        estimationKg > 0 ? ((totals.poidsNetTotal - estimationKg) / estimationKg) * 100 : 0;
    const ecartImportant = estimationKg > 0 && Math.abs(ecartPourcentage) > 15;

    const onSubmit = async (data: CreatePeseeInput) => {
        try {
            setIsLoading(true);

            const result = await createPeseeAction(data);

            if (!result.success) {
                toast.error(result.error || t("messages.error.generic"));
                return;
            }

            toast.success(t("messages.success.created", { entity: t("pesees.title") }));
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
                    {t("pesees.addNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white rounded-[14px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00] flex items-center gap-2">
                        <Scale className="h-5 w-5 text-[#C17A2B]" />
                        {t("pesees.addNew")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("pesees.addNewDescription")}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="livraisonId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("pesees.selectLivraison")} *</FormLabel>
                                    <Select
                                        onValueChange={handleLivraisonChange}
                                        value={field.value}
                                        disabled={isLoading || loadingLivraisons}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="rounded-[7px] bg-white">
                                                <SelectValue
                                                    placeholder={
                                                        loadingLivraisons
                                                            ? t("common.loading")
                                                            : t("pesees.selectLivraisonPlaceholder")
                                                    }
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white">
                                            {livraisons.length === 0 ? (
                                                <div className="p-2 text-sm text-gray-500">
                                                    {t("pesees.noLivraisonsAvailable")}
                                                </div>
                                            ) : (
                                                livraisons.map((livraison) => (
                                                    <SelectItem key={livraison.id} value={livraison.id}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {livraison.numeroLot}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {livraison.agriculteur?.nom} {livraison.agriculteur?.prenom}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-red-600" />
                                </FormItem>
                            )}
                        />

                        {livraisonId && (
                            <FormItem>
                                <FormLabel>{t("pesees.selectTypeCaisse")} *</FormLabel>
                                <Select
                                    onValueChange={handleLigneChange}
                                    value={selectedLigneKey}
                                    disabled={isLoading}
                                >
                                    <FormControl>
                                        <SelectTrigger className="rounded-[7px] bg-white">
                                            <SelectValue placeholder={t("pesees.selectTypeCaissePlaceholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white">
                                        {availableCaisses.length === 0 ? (
                                            <div className="p-2 text-sm text-gray-500">
                                                {t("pesees.noTypeCaisseAvailable")}
                                            </div>
                                        ) : (
                                            availableCaisses.map((c) => {
                                                const key = ligneKey(c.typeCaisseId, c.typeDateId);
                                                const dejaPesee = weighedLigneKeys.has(key);
                                                return (
                                                    <SelectItem key={key} value={key} disabled={dejaPesee}>
                                                        {c.typeCaisse.nom} — {c.typeDate?.nom} — {t("pesees.tare")}: {c.typeCaisse.poidsKg} kg
                                                        {dejaPesee ? ` (${t("pesees.alreadyWeighed")})` : ""}
                                                    </SelectItem>
                                                );
                                            })
                                        )}
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-red-600" />
                            </FormItem>
                        )}

                        {typeCaisseId && typeDateId && (
                            <>
                                {selectedCaisseDeclaree && (
                                    <p className="text-xs text-[#3D1C00]/60">
                                        {t("pesees.quantiteDeclaree", { n: String(selectedCaisseDeclaree.quantite) })}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    {fields.map((caisseField, index) => {
                                        const currentPoids = Number(caisses?.[index]?.poidsBrut) || 0;
                                        const previousPoids = index > 0 ? Number(caisses?.[index - 1]?.poidsBrut) || 0 : 0;
                                        const doublonSuspect = index > 0 && currentPoids > 0 && currentPoids === previousPoids;

                                        return (
                                            <div key={caisseField.id} className="flex items-start gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`caisses.${index}.poidsBrut`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel className="text-xs text-gray-600">
                                                                {t("pesees.caisseLabel", { n: String(index + 1) })}
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    step="0.01"
                                                                    placeholder={t("pesees.grossWeightLabel")}
                                                                    className="rounded-[7px]"
                                                                    disabled={isLoading}
                                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-red-600 text-xs" />
                                                            {doublonSuspect && (
                                                                <p className="text-xs text-amber-600">
                                                                    ⚠️ {t("pesees.doublonSuspect")}
                                                                </p>
                                                            )}
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                    disabled={isLoading || fields.length <= 1}
                                                    className="h-9 w-9 p-0 mt-6 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => append({ poidsBrut: 0 })}
                                    disabled={isLoading}
                                    className="w-full rounded-[9px] border-[#C17A2B] text-[#C17A2B]"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t("pesees.addCaisse")}
                                </Button>

                                <div className="rounded-[7px] bg-[#FAF0DC] border border-[#C17A2B] p-4 space-y-2">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-[#3D1C00]/70">{t("pesees.nombreCaisses")}:</span>{" "}
                                            <span className="font-medium text-[#3D1C00]">{totals.nombreCaisses}</span>
                                        </div>
                                        <div>
                                            <span className="text-[#3D1C00]/70">{t("pesees.poidsBrutTotal")}:</span>{" "}
                                            <span className="font-medium text-[#3D1C00]">{totals.poidsBrutTotal.toFixed(2)} kg</span>
                                        </div>
                                        <div>
                                            <span className="text-[#3D1C00]/70">{t("pesees.poidsTareTotal")}:</span>{" "}
                                            <span className="font-medium text-[#3D1C00]">{totals.poidsTareTotal.toFixed(2)} kg</span>
                                        </div>
                                        <div>
                                            <span className="text-[#3D1C00]/70">{t("pesees.poidsBrutMoyen")}:</span>{" "}
                                            <span className="font-medium text-[#3D1C00]">{totals.poidsBrutMoyen.toFixed(2)} kg</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-[#C17A2B]/30">
                                        <span className="text-sm font-medium text-[#3D1C00]">
                                            {t("pesees.poidsNetTotal")} :
                                        </span>
                                        <span className="text-2xl font-bold text-[#C17A2B]">
                                            {totals.poidsNetTotal.toFixed(2)} kg
                                        </span>
                                    </div>
                                    {totals.poidsNetTotal <= 0 && totals.poidsBrutTotal > 0 && (
                                        <p className="text-xs text-red-600">
                                            ⚠️ {t("pesees.poidsNetMustBePositive")}
                                        </p>
                                    )}
                                    {ecartImportant && (
                                        <p className="text-xs text-amber-700 bg-amber-100 rounded-[7px] p-2">
                                            ⚠️ {t("pesees.ecartImportant", {
                                                pourcentage: ecartPourcentage.toFixed(0),
                                                estimation: estimationKg.toFixed(2),
                                            })}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isLoading}
                                className="rounded-[9px]"
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || fields.length === 0 || totals.poidsNetTotal <= 0}
                                className="bg-[#C17A2B] hover:bg-[#A0621F] text-white rounded-[9px]"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t("common.create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
