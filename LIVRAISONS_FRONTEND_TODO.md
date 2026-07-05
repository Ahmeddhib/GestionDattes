# Livraisons Frontend - Fichiers à créer

## ✅ Traductions complétées
- Français (fr.json) ✅
- Anglais (en.json) ✅  
- Arabe (ar.json) ✅

## 📋 Fichiers frontend à créer

### 1. Pages
```
src/app/(dashboard)/dashboard/livraisons/
  ├── page.tsx (Server Component)
  └── LivraisonsPageContent.tsx (Client Component)
```

### 2. Composants features
```
src/components/features/livraisons/
  ├── columns.tsx
  ├── LivraisonsTableAdvanced.tsx
  ├── CreateLivraisonDialog.tsx
  ├── UpdateLivraisonDialog.tsx
  └── DeleteLivraisonDialog.tsx
```

### 3. Sidebar
- Ajouter le lien dans `src/components/shared/Sidebar.tsx`
- Importer `Truck` de lucide-react
- Ajouter dans section "Management"

---

## 📝 Notes importantes

### Actions à récupérer
Pour les selects dans les formulaires, vous aurez besoin de:
- `getAgricultureursAction()` - Liste des agriculteurs
- `getTypesDatesAction()` - Liste des types de dattes
- `getTypesCaissesAction()` - Liste des types de caisses

### Type de données
```typescript
type Livraison = {
    id: string;
    numeroLot: string;
    dateLivraison: Date;
    quantiteKg: number;
    agriculteur?: {
        id: string;
        code: string;
        nom: string;
        prenom: string;
        cin: string;
    };
    typeDate?: {
        id: string;
        nom: string;
    };
    typeCaisse?: {
        id: string;
        nom: string;
        poidsKg: number;
    };
    _count?: {
        echantillons: number;
        pretsCaisses: number;
        stocksDates: number;
    };
};
```

### Colonnes de la table
1. **N° Lot** - Badge avec `numeroLot`
2. **Date** - Format DD/MM/YYYY
3. **Agriculteur** - `nom + prenom`
4. **Type de datte** - Badge avec nom
5. **Type de caisse** - `nom + (poidsKg kg)`
6. **Quantité** - `quantiteKg + " kg"`
7. **Actions** - Edit + Delete buttons

### Stats cards
- Total livraisons
- Ce mois
- Cette année
- Quantité totale (kg)

---

## 🎨 Design Guidelines

### Couleurs
- Primary: `#C17A2B`
- Background: `#FAF0DC`
- Sidebar: `#3D1C00`

### Border Radius
- Cards/Dialogs: `14px`
- Buttons: `9px`
- Inputs: `7px`

### Icône
- `Truck` de lucide-react (camion de livraison)

---

## 🔄 Workflow création livraison

1. User clique "Nouvelle Livraison"
2. Dialog s'ouvre avec formulaire:
   - Date de livraison (date picker)
   - Select Agriculteur (searchable)
   - Select Type de datte
   - Select Type de caisse
   - Input Quantité (kg)
3. Validation Zod côté client
4. Soumission vers `createLivraisonAction`
5. Numéro de lot auto-généré (LIV-2026-0001)
6. Refresh de la page
7. Toast de succès

---

## ✅ Checklist avant build

- [ ] Tous les composants créés
- [ ] Imports corrects
- [ ] Types TypeScript corrects
- [ ] Actions importées
- [ ] Traductions utilisées via `t()`
- [ ] Background blanc sur dialogs
- [ ] Border radius corrects
- [ ] Sidebar lien ajouté
- [ ] Test `bun run build`

---

## 🚀 Prochaine étape après Livraisons

Une fois le module Livraisons terminé et testé, passer à:
1. **PretCaisse** (Prêt de caisses)
2. **StockDate** (Gestion du stock)
3. **BonSortie** (Bons de sortie)
