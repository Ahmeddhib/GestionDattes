# Implémentation Frontend - Module Stock Caisses

## 🎯 Structure Complète

```
src/
├── app/(dashboard)/dashboard/
│   └── stock-caisses/
│       ├── page.tsx                    ← Page principale
│       └── loading.tsx                 ← Loading state
│
├── components/features/stock-caisses/
│   ├── CreatePretDialog.tsx            ← Dialog créer prêt
│   ├── RetourDialog.tsx                ← Dialog retourner caisses
│   ├── PretsTable.tsx                  ← Tableau prêts en cours
│   ├── columns.tsx                     ← Colonnes du tableau
│   └── StatsCards.tsx                  ← Cartes statistiques
│
└── actions/prets-caisses/
    ├── create-pret.action.ts           ✅ Déjà créé
    ├── retourner-caisses.action.ts     ✅ Déjà créé
    ├── get-prets.action.ts             ✅ Déjà créé
    └── get-prets-agriculteur.action.ts ✅ Déjà créé
```

---

## 📄 1. Page Principale

**Fichier**: `src/app/(dashboard)/dashboard/stock-caisses/page.tsx`

```typescript
import { Suspense } from "react";
import { getPretsAction, getPretsStatistiquesAction } from "@/actions/prets-caisses/get-prets.action";
import { getTypesCaissesAction } from "@/actions/types-caisses/get-types-caisses.action";
import { StatsCards } from "@/components/features/stock-caisses/StatsCards";
import { PretsTable } from "@/components/features/stock-caisses/PretsTable";
import { CreatePretDialog } from "@/components/features/stock-caisses/CreatePretDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default async function StockCaissesPage() {
    const [statsResult, pretsResult, typesCaissesResult] = await Promise.all([
        getPretsStatistiquesAction(),
        getPretsAction(),
        getTypesCaissesAction(),
    ]);

    const stats = statsResult.success ? statsResult.data : null;
    const prets = pretsResult.success ? pretsResult.data : [];
    const typesCaisses = typesCaissesResult.success ? typesCaissesResult.data : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D1C00]">Stock de Caisses</h1>
                    <p className="text-[#3D1C00]/60">Gestion du stock et des prêts de caisses</p>
                </div>
                <CreatePretDialog />
            </div>

            {/* Stats */}
            {stats && <StatsCards stats={stats} />}

            {/* Tableau Stock par Type */}
            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#C17A2B]/20">
                <h2 className="text-xl font-semibold text-[#3D1C00] mb-4">Stock par Type de Caisse</h2>
                <div className="space-y-2">
                    {typesCaisses.map((type) => (
                        <div
                            key={type.id}
                            className="flex items-center justify-between p-4 rounded-[9px] bg-[#FAF0DC] border border-[#C17A2B]/20"
                        >
                            <div>
                                <p className="font-medium text-[#3D1C00]">{type.nom}</p>
                                <p className="text-sm text-[#3D1C00]/60">{type.poidsKg} kg</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-[#C17A2B]">
                                    {type.stockDisponible}
                                </p>
                                <p className="text-xs text-[#3D1C00]/60">Disponibles</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tableau Prêts */}
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
                <PretsTable prets={prets} />
            </Suspense>
        </div>
    );
}
```

---

## 📊 2. Cartes Statistiques

**Fichier**: `src/components/features/stock-caisses/StatsCards.tsx`

```typescript
"use client";

import { Package, TrendingUp, Clock } from "lucide-react";

type StatsCardsProps = {
    stats: {
        totalPrete: number;
        totalRetourne: number;
        restant: number;
        pretsEnCours: number;
    };
};

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#C17A2B]/20">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-[#C17A2B]/10 p-3">
                        <Package className="h-6 w-6 text-[#C17A2B]" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Total Prêté</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.totalPrete}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-green-200">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Total Retourné</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.totalRetourne}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[14px] bg-white p-6 shadow-sm border border-orange-200">
                <div className="flex items-center gap-4">
                    <div className="rounded-full bg-orange-100 p-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm text-[#3D1C00]/60">Prêts En Cours</p>
                        <p className="text-2xl font-bold text-[#3D1C00]">{stats.pretsEnCours}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

---

## 📋 3. Tableau des Prêts

**Fichier**: `src/components/features/stock-caisses/PretsTable.tsx`

```typescript
"use client";

import { DataTable } from "@/components/ui/data-table";
import { createPretsColumns } from "./columns";
import { useClientTranslations } from "@/hooks/useClientTranslations";

type PretsTableProps = {
    prets: any[];
};

export function PretsTable({ prets }: PretsTableProps) {
    const { t } = useClientTranslations();
    const columns = createPretsColumns(t);

    return (
        <div className="rounded-[14px] bg-white p-6 shadow-sm border border-[#C17A2B]/20">
            <h2 className="text-xl font-semibold text-[#3D1C00] mb-4">
                Prêts en Cours
            </h2>
            <DataTable columns={columns} data={prets} />
        </div>
    );
}
```

---

## 📝 4. Colonnes du Tableau

**Fichier**: `src/components/features/stock-caisses/columns.tsx`

```typescript
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { RetourDialog } from "./RetourDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type PretCaisse = {
    id: string;
    nombrePrete: number;
    nombreRetourne: number;
    nombreRestant: number;
    statut: "EN_COURS" | "RETOURNE" | "INCOMPLET";
    datePreT: Date;
    dateRetour?: Date | null;
    observations?: string | null;
    agriculteur: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
    };
    typeCaisse: {
        id: string;
        nom: string;
        poidsKg: number;
    };
};

export const createPretsColumns = (
    t: (key: string) => string
): ColumnDef<PretCaisse>[] => [
    {
        accessorKey: "agriculteur",
        header: t("pretsCaisses.agriculteur"),
        cell: ({ row }) => {
            const agriculteur = row.original.agriculteur;
            return (
                <div className="font-medium text-[#3D1C00]">
                    {agriculteur.nom} {agriculteur.prenom}
                    <div className="text-xs text-[#3D1C00]/60">{agriculteur.code}</div>
                </div>
            );
        },
    },
    {
        accessorKey: "typeCaisse",
        header: t("pretsCaisses.typeCaisse"),
        cell: ({ row }) => {
            const typeCaisse = row.original.typeCaisse;
            return (
                <div className="text-sm text-[#3D1C00]">
                    {typeCaisse.nom}
                    <div className="text-xs text-[#3D1C00]/60">
                        {typeCaisse.poidsKg} kg
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "nombrePrete",
        header: t("pretsCaisses.nombrePrete"),
        cell: ({ row }) => (
            <div className="font-semibold text-[#C17A2B]">
                {row.getValue("nombrePrete")}
            </div>
        ),
    },
    {
        accessorKey: "nombreRetourne",
        header: t("pretsCaisses.nombreRetourne"),
        cell: ({ row }) => (
            <div className="font-semibold text-green-600">
                {row.getValue("nombreRetourne")}
            </div>
        ),
    },
    {
        accessorKey: "nombreRestant",
        header: t("pretsCaisses.nombreRestant"),
        cell: ({ row }) => {
            const restant = row.getValue("nombreRestant") as number;
            return (
                <div className={`font-bold ${restant > 0 ? "text-orange-600" : "text-gray-400"}`}>
                    {restant}
                </div>
            );
        },
    },
    {
        accessorKey: "statut",
        header: t("pretsCaisses.statut"),
        cell: ({ row }) => {
            const statut = row.getValue("statut") as string;
            const variants: Record<string, any> = {
                EN_COURS: "default",
                RETOURNE: "secondary",
                INCOMPLET: "destructive",
            };
            const labels: Record<string, string> = {
                EN_COURS: t("pretsCaisses.enCours"),
                RETOURNE: t("pretsCaisses.retourne"),
                INCOMPLET: t("pretsCaisses.incomplet"),
            };
            return (
                <Badge variant={variants[statut] || "default"}>
                    {labels[statut] || statut}
                </Badge>
            );
        },
    },
    {
        accessorKey: "datePreT",
        header: t("pretsCaisses.datePret"),
        cell: ({ row }) => {
            const date = new Date(row.getValue("datePreT"));
            return (
                <div className="text-sm text-[#3D1C00]">
                    {format(date, "dd/MM/yyyy", { locale: fr })}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => {
            const pret = row.original;
            if (pret.statut === "RETOURNE") {
                return <span className="text-xs text-gray-400">Clôturé</span>;
            }
            return <RetourDialog pret={pret} />;
        },
    },
];
```

---

## ➕ 5. Dialog Créer Prêt

**Fichier**: `src/components/features/stock-caisses/CreatePretDialog.tsx`

```typescript
"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
            toast.success("Prêt créé avec succès");
            setOpen(false);
            (e.target as HTMLFormElement).reset();
            setSelectedAgriculteur("");
            setSelectedTypeCaisse("");
        } else {
            toast.error(result.error || "Erreur lors de la création du prêt");
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
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Agriculteur */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">{t("pretsCaisses.agriculteur")}</Label>
                        <Select value={selectedAgriculteur} onValueChange={setSelectedAgriculteur} required>
                            <SelectTrigger className="rounded-[7px] bg-white">
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
                            <SelectTrigger className="rounded-[7px] bg-white">
                                <SelectValue placeholder={t("pretsCaisses.selectTypeCaisse")} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {typesCaisses.map((tc) => (
                                    <SelectItem key={tc.id} value={tc.id}>
                                        {tc.nom} ({tc.poidsKg} kg) - Stock: {tc.stockDisponible}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="typeCaisseId" value={selectedTypeCaisse} />
                    </div>

                    {/* Nombre */}
                    <div className="space-y-2">
                        <Label className="text-[#3D1C00]">
                            {t("pretsCaisses.nombrePrete")} (Max: {stockMax})
                        </Label>
                        <Input
                            name="nombrePrete"
                            type="number"
                            min="1"
                            max={stockMax}
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
                        <Button type="submit" disabled={loading} className="rounded-[9px] bg-[#C17A2B]">
                            {loading ? t("pretsCaisses.preting") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

---

## 🔄 6. Dialog Retour

**Fichier**: `src/components/features/stock-caisses/RetourDialog.tsx`

```typescript
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
```

---

## ✅ Checklist Implémentation

### Backend
- [x] Migration SQL
- [x] Schéma Prisma
- [x] Repository
- [x] Service
- [x] Validators
- [x] Actions

### Frontend
- [ ] Traductions (FR, EN, AR)
- [ ] Page principale
- [ ] StatsCards
- [ ] PretsTable
- [ ] Colonnes
- [ ] CreatePretDialog
- [ ] RetourDialog
- [ ] Navigation (ajouter dans sidebar)

### Tests
- [ ] Créer un prêt
- [ ] Retour partiel
- [ ] Retour complet
- [ ] Stock insuffisant
- [ ] Affichage stats

---

**Status**: Guide complet créé
**Prochaine étape**: Implémenter les composants
