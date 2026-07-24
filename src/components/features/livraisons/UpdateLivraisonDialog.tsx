"use client";

import { useState, useEffect } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateLivraisonAction } from "@/actions/livraisons/update-livraison.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesDatesAction } from "@/actions/types-dates/get-types-dates.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type CaisseItem = {
    typeCaisseId: string;
    typeDateId: string;
    quantite: number;
};

type UpdateLivraisonDialogProps = {
    livraison: {
        id: string;
        numeroLot: string;
        dateLivraison: Date;
        quantiteKg: number;
        quantiteLivree?: number;
        quantiteAcceptee?: number;
        agriculteurId?: string;
        agriculteur?: {
            id: string;
            code: string;
            nom: string;
            prenom: string;
            cin: string;
        };
        caisses?: Array<{
            id: string;
            typeCaisseId: string;
            typeDateId: string;
            quantite: number;
            typeCaisse: {
                id: string;
                nom: string;
                poidsKg: number;
            };
            typeDate?: {
                id: string;
                nom: string;
            };
        }>;
    };
    canEditAcceptedQuantity: boolean;
};

export function UpdateLivraisonDialog({ livraison, canEditAcceptedQuantity }: UpdateLivraisonDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [agriculteurs, setAgriculteurs] = useState<any[]>([]);
    const [typesDates, setTypesDates] = useState<any[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<any[]>([]);

    const [selectedAgriculteur, setSelectedAgriculteur] = useState(
        livraison.agriculteurId || livraison.agriculteur?.id || ""
    );
    const [quantiteLivree, setQuantiteLivree] = useState(livraison.quantiteLivree ?? livraison.quantiteKg);
    const [quantiteAcceptee, setQuantiteAcceptee] = useState(livraison.quantiteAcceptee ?? livraison.quantiteLivree ?? livraison.quantiteKg);

    // État pour gérer les caisses - initialiser avec les caisses existantes
    const [caisses, setCaisses] = useState<CaisseItem[]>(
        livraison.caisses && livraison.caisses.length > 0
            ? livraison.caisses.map(c => ({
                typeCaisseId: c.typeCaisseId,
                typeDateId: c.typeDateId,
                quantite: c.quantite
            }))
            : [{ typeCaisseId: "", typeDateId: "", quantite: 1 }]
    );

    useEffect(() => {
        if (open) {
            loadData();
            // Réinitialiser les caisses avec les données actuelles
            if (livraison.caisses && livraison.caisses.length > 0) {
                setCaisses(livraison.caisses.map(c => ({
                    typeCaisseId: c.typeCaisseId,
                    typeDateId: c.typeDateId,
                    quantite: c.quantite
                })));
            }
            setQuantiteLivree(livraison.quantiteLivree ?? livraison.quantiteKg);
            setQuantiteAcceptee(livraison.quantiteAcceptee ?? livraison.quantiteLivree ?? livraison.quantiteKg);
        }
    }, [open]);

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

    // Ajouter une ligne de caisse
    const addCaisse = () => {
        setCaisses([...caisses, { typeCaisseId: "", typeDateId: "", quantite: 1 }]);
    };

    // Retirer une ligne de caisse
    const removeCaisse = (index: number) => {
        if (caisses.length > 1) {
            const newCaisses = caisses.filter((_, i) => i !== index);
            setCaisses(newCaisses);
        }
    };

    // Mettre à jour une caisse
    const updateCaisse = (index: number, field: keyof CaisseItem, value: string | number) => {
        const newCaisses = [...caisses];
        newCaisses[index] = {
            ...newCaisses[index],
            [field]: field === "quantite" ? Number(value) : value,
        };
        setCaisses(newCaisses);
    };

    // Calculer le total en kg
    const calculateTotal = () => {
        return caisses.reduce((total, caisse) => {
            const typeCaisse = typesCaisses.find(tc => tc.id === caisse.typeCaisseId);
            if (typeCaisse && caisse.quantite) {
                return total + (caisse.quantite * typeCaisse.poidsKg);
            }
            return total;
        }, 0);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // Validation des caisses
        const validCaisses = caisses.filter(c => c.typeCaisseId && c.quantite > 0);
        if (validCaisses.length === 0) {
            toast.error(t("livraisons.atLeastOneCaisse") || "Au moins une caisse est requise");
            return;
        }

        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // Ajouter les caisses en JSON
        formData.append("caisses", JSON.stringify(validCaisses));

        const result = await updateLivraisonAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.updated").replace("{entity}", t("livraisons.title")));
            setOpen(false);
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    // Format date for input type="date" (YYYY-MM-DD)
    const formattedDate = livraison.dateLivraison instanceof Date
        ? livraison.dateLivraison.toISOString().split("T")[0]
        : new Date(livraison.dateLivraison).toISOString().split("T")[0];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[7px] text-[#C17A2B] hover:bg-[#C17A2B]/10 hover:text-[#C17A2B]"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("livraisons.updateDialog")}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("livraisons.updateDescription")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={livraison.id} />

                    <div className="space-y-2">
                        <Label htmlFor="dateLivraison" className="text-[#3D1C00]">
                            {t("livraisons.dateLivraison")}
                        </Label>
                        <Input
                            id="dateLivraison"
                            name="dateLivraison"
                            type="date"
                            required
                            defaultValue={formattedDate}
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agriculteurId" className="text-[#3D1C00]">
                            {t("livraisons.agriculteur")}
                        </Label>
                        <Select
                            value={selectedAgriculteur}
                            onValueChange={setSelectedAgriculteur}
                            required
                        >
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
                        <input type="hidden" name="agriculteurId" value={selectedAgriculteur} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="quantiteLivree">Quantité livrée (kg)</Label>
                            <Input id="quantiteLivree" name="quantiteLivree" type="number" min="0" step="0.01" required value={quantiteLivree}
                                onChange={(event) => {
                                    const value = Math.max(0, Number(event.target.value));
                                    const acceptedMatchesDelivered = quantiteAcceptee === quantiteLivree;
                                    setQuantiteLivree(value);
                                    if (!canEditAcceptedQuantity || acceptedMatchesDelivered) setQuantiteAcceptee(value);
                                }} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantiteAcceptee">Quantité acceptée (kg)</Label>
                            <Input id="quantiteAcceptee" name="quantiteAcceptee" type="number" min="0" max={quantiteLivree} step="0.01" required value={quantiteAcceptee}
                                disabled={!canEditAcceptedQuantity}
                                onChange={(event) => setQuantiteAcceptee(Math.min(quantiteLivree, Math.max(0, Number(event.target.value))))} />
                        </div>
                    </div>

                    {/* Section Caisses */}
                    <div className="space-y-3 border-t pt-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-[#3D1C00] text-base font-semibold">
                                {t("livraisons.caisses") || "Caisses"}
                            </Label>
                            <Button
                                type="button"
                                onClick={addCaisse}
                                size="sm"
                                className="gap-1 rounded-[7px] bg-[#C17A2B] hover:bg-[#A0621F]"
                            >
                                <Plus className="h-3 w-3" />
                                {t("livraisons.addCaisse") || "Ajouter"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {caisses.map((caisse, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Select
                                            value={caisse.typeDateId}
                                            onValueChange={(value) => updateCaisse(index, "typeDateId", value)}
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
                                    </div>
                                    <div className="flex-1">
                                        <Select
                                            value={caisse.typeCaisseId}
                                            onValueChange={(value) => updateCaisse(index, "typeCaisseId", value)}
                                        >
                                            <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                                <SelectValue placeholder={t("livraisons.selectTypeCaisse")} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                {typesCaisses.map((tc) => (
                                                    <SelectItem key={tc.id} value={tc.id}>
                                                        {tc.nom} ({tc.poidsKg} kg)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={caisse.quantite}
                                            onChange={(e) => updateCaisse(index, "quantite", e.target.value)}
                                            placeholder="Qté"
                                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                                        />
                                    </div>
                                    {caisses.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeCaisse(index)}
                                            className="h-10 w-10 rounded-[7px] text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Affichage du total */}
                        <div className="bg-[#FAF0DC] rounded-[7px] p-3 flex justify-between items-center">
                            <span className="text-sm text-[#3D1C00] font-medium">
                                {t("livraisons.totalKg") || "Total"}:
                            </span>
                            <span className="text-lg font-bold text-[#C17A2B]">
                                {calculateTotal().toFixed(2)} kg
                            </span>
                        </div>
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
                            {loading ? t("livraisons.updating") : t("common.save")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
