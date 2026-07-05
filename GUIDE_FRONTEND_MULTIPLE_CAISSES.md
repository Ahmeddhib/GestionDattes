# Guide: Mise à jour Frontend pour Multiple Caisses

## 🎯 Objectif

Mettre à jour les composants frontend pour permettre l'ajout de plusieurs types de caisses avec leurs quantités dans une livraison.

---

## 📋 Composants à modifier

### 1. CreateLivraisonDialog.tsx

**Emplacement**: `src/components/features/livraisons/CreateLivraisonDialog.tsx`

**Code complet du nouveau composant**:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
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

type CaisseItem = {
    typeCaisseId: string;
    quantite: number;
};

export function CreateLivraisonDialog() {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [agriculteurs, setAgriculteurs] = useState<any[]>([]);
    const [typesDates, setTypesDates] = useState<any[]>([]);
    const [typesCaisses, setTypesCaisses] = useState<any[]>([]);

    const [selectedAgriculteur, setSelectedAgriculteur] = useState("");
    const [selectedTypeDate, setSelectedTypeDate] = useState("");
    
    // État pour gérer les caisses
    const [caisses, setCaisses] = useState<CaisseItem[]>([
        { typeCaisseId: "", quantite: 1 }
    ]);

    useEffect(() => {
        if (open) {
            loadData();
            // Réinitialiser les caisses à l'ouverture
            setCaisses([{ typeCaisseId: "", quantite: 1 }]);
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
        setCaisses([...caisses, { typeCaisseId: "", quantite: 1 }]);
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

        const result = await createLivraisonAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("livraisons.title")));
            setOpen(false);
            (e.target as HTMLFormElement).reset();
            setSelectedAgriculteur("");
            setSelectedTypeDate("");
            setCaisses([{ typeCaisseId: "", quantite: 1 }]);
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
            <DialogContent className="rounded-[14px] sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
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
                            {loading ? t("livraisons.creating") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

---

### 2. Traductions à ajouter

**Fichiers**: `src/i18n/locales/fr.json`, `en.json`, `ar.json`

**Français** (`fr.json`):
```json
{
  "livraisons": {
    ...existant...,
    "caisses": "Caisses",
    "addCaisse": "Ajouter",
    "removeCaisse": "Retirer",
    "atLeastOneCaisse": "Au moins une caisse est requise",
    "totalKg": "Total"
  }
}
```

**Anglais** (`en.json`):
```json
{
  "livraisons": {
    ...existing...,
    "caisses": "Crates",
    "addCaisse": "Add",
    "removeCaisse": "Remove",
    "atLeastOneCaisse": "At least one crate is required",
    "totalKg": "Total"
  }
}
```

**Arabe** (`ar.json`):
```json
{
  "livraisons": {
    ...موجود...,
    "caisses": "صناديق",
    "addCaisse": "إضافة",
    "removeCaisse": "حذف",
    "atLeastOneCaisse": "صندوق واحد على الأقل مطلوب",
    "totalKg": "المجموع"
  }
}
```

---

## 🧪 Test du composant

1. **Démarrer le serveur dev**:
   ```bash
   bun run dev
   ```

2. **Tester le CreateDialog**:
   - Ouvrir `/dashboard/livraisons`
   - Cliquer sur "Nouvelle Livraison"
   - Ajouter plusieurs types de caisses
   - Vérifier le calcul du total
   - Supprimer des lignes
   - Valider le formulaire

3. **Vérifier les données**:
   - Ouvrir la console réseau
   - Vérifier que `caisses` est envoyé en JSON
   - Vérifier la réponse du serveur

---

## ✅ Checklist

- [ ] Remplacer le contenu de `CreateLivraisonDialog.tsx`
- [ ] Ajouter les traductions dans `fr.json`
- [ ] Ajouter les traductions dans `en.json`
- [ ] Ajouter les traductions dans `ar.json`
- [ ] Tester ajout de caisses
- [ ] Tester suppression de caisses
- [ ] Tester calcul du total
- [ ] Tester validation (minimum 1 caisse)
- [ ] Tester création d'une livraison
- [ ] Vérifier dans la base de données

---

## 📝 Notes

- Le total est calculé en temps réel
- Minimum 1 caisse requise (bouton supprimer désactivé si 1 seule)
- Validation côté client ET serveur
- Les caisses sont envoyées en JSON stringifié
- Le backend parse automatiquement le JSON