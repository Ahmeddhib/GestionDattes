"use client";

import { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { retournerCaissesAction } from "@/actions/prets-caisses/retourner-caisses.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type RetourDialogProps = {
    pret: {
        id: string;
        nombrePrete: number;
        nombreRetourne: number;
        nombreRestant: number;
        agriculteur: { nom: string; prenom: string };
        typeCaisse: { nom: string };
    };
};

export function RetourDialog({ pret }: RetourDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await retournerCaissesAction(formData);
        setLoading(false);

        if (result.success) {
            toast.success("Retour enregistré avec succès");
            setOpen(false);
        } else {
            toast.error(result.error || "Erreur lors du retour");
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[7px] text-green-600">
                    <ArrowDownToLine className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[450px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("pretsCaisses.retournerCaisses")}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="pretId" value={pret.id} />

                    {/* Info Prêt */}
                    <div className="rounded-[9px] bg-[#FAF0DC] p-4 space-y-2">
                        <p className="text-sm font-medium text-[#3D1C00]">
                            {pret.agriculteur.nom} {pret.agriculteur.prenom}
                        </p>
                        <p className="text-sm text-[#3D1C00]/60">{pret.typeCaisse.nom}</p>
                        <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                            <div>
                                <p className="text-xs text-[#3D1C00]/60">Prêté</p>
                                <p className="text-lg font-bold text-[#C17A2B]">{pret.nombrePrete}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#3D1C00]/60">Retourné</p>
                                <p className="text-lg font-bold text-green-600">{pret.nombreRetourne}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#3D1C00]/60">Restant</p>
                                <p className="text-lg font-bold text-orange-600">{pret.nombreRestant}</p>
                            </div>
                        </div>
                    </div>

                    {/* Nombre à retourner */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">
                            {t("pretsCaisses.nombreARetourner")} (Max: {pret.nombreRestant})
                        </Label>
                        <Input
                            name="nombreRetourne"
                            type="number"
                            min="1"
                            max={pret.nombreRestant}
                            required
                            className="rounded-[7px] bg-white"
                        />
                    </div>

                    {/* Observations */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("pretsCaisses.observations")}</Label>
                        <Textarea name="observations" className="rounded-[7px] bg-white" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-[9px]">
                            {t("common.cancel")}
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-[9px] bg-green-600 hover:bg-green-700">
                            {loading ? t("pretsCaisses.returning") : t("pretsCaisses.enregistrerRetour")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
