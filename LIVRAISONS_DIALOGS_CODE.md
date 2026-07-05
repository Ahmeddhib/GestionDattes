# Code des Dialogs Livraisons

Les 3 dialogs suivants doivent être créés dans `src/components/features/livraisons/`:

## 1. CreateLivraisonDialog.tsx

```typescript
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
import { toast } from "sonner";
import { createLivraisonAction } from "@/actions/livraisons/create-livraison.action";
import { getAgricultureursSimpleAction } from "@/actions/agriculteurs/get-agriculteurs-simple.action";
import { getTypesDatesAction } from "@/actions/types-dates/get-types-dates.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function CreateLivraisonDialog() {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const [agriculteurs, setAgriculteurs] = useState<any[]>([]);
    const [typesDates, setTypesDates] = useState<any[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<any[]>([]);
    
    const [selectedAgriculteur, setSelectedAgriculteur] = useState("");
    const [selectedTypeDate, setSelectedTypeDate] = useState("");
    const [selectedTypeCaisse, setSelectedTypeCaisse] = useState("");

    useEffect(() => {
        if (open) {
            loadData();
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

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createLivraisonAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("livraisons.title")));
            setOpen(false);
            (e.target as HTMLFormElement).reset();
            setSelectedAgriculteur("");
            setSelectedTypeDate("");
            setSelectedTypeCaisse("");
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("livraisons.createNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("livraisons.createDialog")}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("livraisons.createDescription")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="dateLivraison" className="text-[#3D1C00]">
                            {t("livraisons.dateLivraison")}
                        </Label>
                        <Input
                            id="dateLivraison"
                            name="dateLivraison"
                            type="date"
                            required
                            defaultValue={new Date().toISOString().split("T")[0]}
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="agriculteurId" className="text-[#3D1C00]">
                            {t("livraisons.agriculteur")}
                        </Label>
                        <Select
                            name="agriculteurId"
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

                    <div className="space-y-2">
                        <Label htmlFor="typeDateId" className="text-[#3D1C00]">
                            {t("livraisons.typeDate")}
                        </Label>
                        <Select
                            name="typeDateId"
                            value={selectedTypeDate}
                            onValueChange={setSelectedTypeDate}
                            required
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
                        <input type="hidden" name="typeDateId" value={selectedTypeDate} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="typeCaisseId" className="text-[#3D1C00]">
                            {t("livraisons.typeCaisse")}
                        </Label>
                        <Select
                            name="typeCaisseId"
                            value={selectedTypeCaisse}
                            onValueChange={setSelectedTypeCaisse}
                            required
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
                        <input type="hidden" name="typeCaisseId" value={selectedTypeCaisse} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantiteKg" className="text-[#3D1C00]">
                            {t("livraisons.quantiteKg")}
                        </Label>
                        <Input
                            id="quantiteKg"
                            name="quantiteKg"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
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
                            {loading ? t("livraisons.creating") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

## 2. UpdateLivraisonDialog.tsx

Similar structure but with `defaultValue` for each field and uses `updateLivraisonAction`.

## 3. DeleteLivraisonDialog.tsx

```typescript
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteLivraisonAction } from "@/actions/livraisons/delete-livraison.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type DeleteLivraisonDialogProps = {
    livraison: {
        id: string;
        numeroLot: string;
    };
};

export function DeleteLivraisonDialog({ livraison }: DeleteLivraisonDialogProps) {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        setLoading(true);
        const result = await deleteLivraisonAction(livraison.id);
        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.deleted").replace("{entity}", t("livraisons.title")));
            setOpen(false);
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-[7px] text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[14px] bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#3D1C00]">
                        {t("livraisons.deleteDialog")}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#3D1C00]/60">
                        {t("livraisons.deleteWarning").replace("{numeroLot}", livraison.numeroLot)}
                        <br />
                        <br />
                        {t("livraisons.deleteIrreversible")}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-[9px]" disabled={loading}>
                        {t("common.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="rounded-[9px] bg-red-600 hover:bg-red-700"
                    >
                        {loading ? t("livraisons.deleting") : t("common.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

## 4. Mise à jour Sidebar

Dans `src/components/shared/Sidebar.tsx`:

```typescript
// Ajouter l'import
import { Truck } from "lucide-react";

// Dans la section Management items:
{
    href: "/dashboard/livraisons",
    label: t("nav.livraisons"),
    icon: Truck,
},
```

## Notes importantes

- date-fns est nécessaire pour le formatage des dates
- Les Select components nécessitent un state local + hidden input
- UpdateLivraisonDialog est similaire mais avec les valeurs par défaut
