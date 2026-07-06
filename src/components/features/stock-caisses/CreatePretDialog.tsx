"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const [selectedAgriculteur, setSelectedAgriculteur] = useState("");
    const [selectedTypeCaisse, setSelectedTypeCaisse] = useState("");
    const [stockMax, setStockMax] = useState(0);

    useEffect(() => {
        if (open) loadData();
    }, [open]);

    useEffect(() => {
        if (selectedTypeCaisse) {
            const type = typesCaisses.find(t => t.id === selectedTypeCaisse);
            setStockMax(type?.stockDisponible || 0);
        }
    }, [selectedTypeCaisse, typesCaisses]);

    async function loadData() {
        const [agriResult, caissesResult] = await Promise.all([
            getAgricultureursSimpleAction(),
            getTypesCaissesAction(),
        ]);
        if (agriResult.success) setAgriculteurs(agriResult.data || []);
        if (caissesResult.success) setTypesCaisses(caissesResult.data || []);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await createPretAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", "Prêt"));
            setOpen(false);
            (e.target as HTMLFormElement).reset();
            setSelectedAgriculteur("");
            setSelectedTypeCaisse("");
            // Recharger la page pour voir les changements
            window.location.reload();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                        Enregistrer un nouveau prêt de caisses à un agriculteur
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Agriculteur */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("pretsCaisses.agriculteur")}</Label>
                        <Select value={selectedAgriculteur} onValueChange={setSelectedAgriculteur} required>
                            <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                <SelectValue placeholder={t("pretsCaisses.selectAgriculteur")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {agriculteurs.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="agriculteurId" value={selectedAgriculteur} />
                    </div>

                    {/* Type Caisse */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("pretsCaisses.typeCaisse")}</Label>
                        <Select value={selectedTypeCaisse} onValueChange={setSelectedTypeCaisse} required>
                            <SelectTrigger className="rounded-[7px] border-[#C17A2B]/20 bg-white">
                                <SelectValue placeholder={t("pretsCaisses.selectTypeCaisse")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {typesCaisses.map((tc) => (
                                    <SelectItem key={tc.id} value={tc.id}>
                                        {tc.nom} ({tc.poidsKg} kg) - Stock: {tc.stockDisponible || 0}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="typeCaisseId" value={selectedTypeCaisse} />
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">
                            {t("pretsCaisses.nombrePrete")}
                            {stockMax > 0 && <span className="text-orange-600"> (Max: {stockMax})</span>}
                        </Label>
                        <Input
                            name="nombrePrete"
                            type="number"
                            min="1"
                            max={stockMax}
                            required
                            placeholder="Nombre de caisses à prêter"
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                        {stockMax === 0 && selectedTypeCaisse && (
                            <p className="text-xs text-red-600">Stock insuffisant pour ce type de caisse</p>
                        )}
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("pretsCaisses.observations")}</Label>
                        <Textarea
                            name="observations"
                            placeholder="Notes optionnelles..."
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
                            disabled={loading || stockMax === 0}
                            className="rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]"
                        >
                            {loading ? t("pretsCaisses.preting") || "Prêt en cours..." : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
