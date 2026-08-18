"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { toast } from "sonner";
import { updateTypeCaisseAction } from "@/actions/types-caisses/update-type-caisse.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type TypeCaisse = {
    id: string;
    nom: string;
    poidsKg: number;
    stockDisponible?: number;
};

type UpdateTypeCaisseDialogProps = {
    typeCaisse: TypeCaisse;
};

export function UpdateTypeCaisseDialog({ typeCaisse }: UpdateTypeCaisseDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await updateTypeCaisseAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.updated").replace("{entity}", t("typesCaisses.title")));
            setOpen(false);
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
            <DialogContent className="rounded-lg sm:max-w-125 bg-card">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {t("typesCaisses.updateDialog")}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {t("typesCaisses.updateDescription")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="id" value={typeCaisse.id} />

                    <div className="space-y-2">
                        <Label htmlFor="nom" className="text-foreground">
                            {t("typesCaisses.name")}
                        </Label>
                        <Input
                            id="nom"
                            name="nom"
                            defaultValue={typeCaisse.nom}
                            placeholder={t("typesCaisses.namePlaceholder")}
                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="poidsKg" className="text-foreground">
                            {t("typesCaisses.poids")}
                        </Label>
                        <Input
                            id="poidsKg"
                            name="poidsKg"
                            type="number"
                            step="0.01"
                            min="0.01"
                            defaultValue={typeCaisse.poidsKg}
                            placeholder={t("typesCaisses.poidsPlaceholder")}
                            className="rounded-sm border-border focus:border-[#C17A2B] bg-card"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="stockDisponible" className="text-foreground">
                            {t("typesCaisses.stockDisponible")}
                        </Label>
                        <Input
                            id="stockDisponible"
                            name="stockDisponible"
                            type="number"
                            min="0"
                            defaultValue={typeCaisse.stockDisponible}
                            placeholder="Quantité en stock"
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
                            {loading ? t("typesCaisses.updating") : t("common.save")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
