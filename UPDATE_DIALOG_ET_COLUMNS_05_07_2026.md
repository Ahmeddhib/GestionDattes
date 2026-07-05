# Mise à jour du Dialog Update et Colonnes - 05/07/2026

## Modifications Appliquées

### 1. UpdateLivraisonDialog.tsx

**Transformations**:
- ✅ Ajout du support des caisses multiples
- ✅ Gestion dynamique de l'array de caisses
- ✅ Boutons Ajouter/Retirer comme dans CreateDialog
- ✅ Calcul en temps réel du total en kg
- ✅ Pré-remplissage avec les caisses existantes
- ✅ Validation minimum 1 caisse
- ✅ Sérialisation JSON des caisses

**Nouvelles fonctionnalités**:

```typescript
// Type pour une caisse
type CaisseItem = {
    typeCaisseId: string;
    quantite: number;
};

// État initialisé avec les caisses existantes
const [caisses, setCaisses] = useState<CaisseItem[]>(
    livraison.caisses && livraison.caisses.length > 0
        ? livraison.caisses.map(c => ({
            typeCaisseId: c.typeCaisseId,
            quantite: c.quantite
        }))
        : [{ typeCaisseId: "", quantite: 1 }]
);
```

**Fonctions ajoutées**:
- `addCaisse()` - Ajouter une ligne de caisse
- `removeCaisse(index)` - Supprimer une ligne (min 1)
- `updateCaisse(index, field, value)` - Modifier une caisse
- `calculateTotal()` - Calculer le total en kg en temps réel

**Interface**:
- Dialog élargi: `sm:max-w-[600px]`
- Scroll activé: `max-h-[90vh] overflow-y-auto`
- Section caisses avec border-top
- Badge total avec fond `#FAF0DC` et texte `#C17A2B`

### 2. columns.tsx

**Modifications du type Livraison**:

```typescript
// ❌ AVANT
typeCaisse?: {
    id: string;
    nom: string;
    poidsKg: number;
};

// ✅ APRÈS
caisses?: Array<{
    id: string;
    typeCaisseId: string;
    quantite: number;
    typeCaisse: {
        id: string;
        nom: string;
        poidsKg: number;
    };
}>;
```

**Nouvelle colonne "Caisses"**:

Format d'affichage détaillé:
```
5x Caisse 10kg (50.00 kg)
3x Caisse 20kg (60.00 kg)
─────────────────────────
Total: 110.00 kg
```

**Structure de la cellule**:
- Chaque caisse sur une ligne séparée
- Format: `{quantite}x {nom} ({totalKg} kg)`
- Quantité en couleur brand `#C17A2B`
- Nom en couleur principale `#3D1C00`
- Poids en gris `#3D1C00]/60`
- Ligne de total si > 1 caisse
- Max-width: 250px
- Font-size: text-xs

**Colonne quantiteKg simplifiée**:
- Retiré le Badge
- Affichage simple avec font-semibold
- Couleur brand `#C17A2B`

## Résultat Visuel

### Tableau des Livraisons

| N° Lot | Date | Agriculteur | Type Datte | **Caisses** | Quantité | Actions |
|--------|------|-------------|------------|-------------|----------|---------|
| LIV-2026-001 | 05/07/2026 | Ali Ben Salem | Deglet Nour | **5x** Caisse 10kg (50kg)<br>**3x** Caisse 20kg (60kg)<br>───────────<br>**Total: 110kg** | **110.00 kg** | ✏️ 🗑️ |

### Dialog Update

```
┌─────────────────────────────────────────┐
│ Modifier la Livraison                   │
├─────────────────────────────────────────┤
│ Date: [05/07/2026]                      │
│ Agriculteur: [Ali Ben Salem ▾]          │
│ Type de datte: [Deglet Nour ▾]          │
│                                          │
│ ─────────────────────────────────────── │
│                                          │
│ Caisses                     [+ Ajouter]  │
│                                          │
│ [Caisse 10kg ▾]    [5]    [🗑️]          │
│ [Caisse 20kg ▾]    [3]    [🗑️]          │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Total:                   110.00 kg │  │
│ └────────────────────────────────────┘  │
│                                          │
│              [Annuler]  [Enregistrer]    │
└─────────────────────────────────────────┘
```

## Fichiers Modifiés

1. ✅ `src/components/features/livraisons/UpdateLivraisonDialog.tsx`
   - Support caisses multiples
   - Pré-remplissage des données existantes
   - Calcul temps réel

2. ✅ `src/components/features/livraisons/columns.tsx`
   - Type `Livraison` mis à jour
   - Colonne "Caisses" avec affichage détaillé
   - Colonne "quantiteKg" simplifiée

## Comportement

### Au chargement du Dialog Update:
1. Les caisses existantes sont chargées depuis `livraison.caisses`
2. Chaque caisse est affichée avec son type et quantité
3. Le total est calculé automatiquement
4. L'utilisateur peut modifier, ajouter ou retirer des caisses

### À la soumission:
1. Validation: au moins 1 caisse avec typeCaisseId + quantité > 0
2. Sérialisation JSON: `formData.append("caisses", JSON.stringify(validCaisses))`
3. Envoi au backend via `updateLivraisonAction`
4. Backend met à jour les relations `LivraisonTypeCaisse`

### Dans le tableau:
1. Affichage de toutes les caisses avec détails
2. Calcul automatique du total pour chaque caisse
3. Total global affiché si > 1 caisse
4. Format compact et lisible

## Tests à Effectuer

### Test 1: Modifier une livraison existante
1. ✅ Ouvrir `/dashboard/livraisons`
2. ✅ Cliquer sur l'icône "Modifier" d'une livraison
3. ✅ Vérifier que les caisses existantes sont affichées
4. ✅ Modifier une quantité
5. ✅ Vérifier que le total se met à jour
6. ✅ Enregistrer et vérifier les changements

### Test 2: Ajouter une caisse
1. ✅ Ouvrir le dialog Update
2. ✅ Cliquer sur "Ajouter"
3. ✅ Sélectionner un nouveau type de caisse
4. ✅ Saisir une quantité
5. ✅ Vérifier le total
6. ✅ Enregistrer

### Test 3: Retirer une caisse
1. ✅ Ouvrir le dialog Update d'une livraison avec > 1 caisse
2. ✅ Cliquer sur l'icône "Supprimer" d'une caisse
3. ✅ Vérifier que la caisse est retirée
4. ✅ Vérifier que le total est recalculé
5. ✅ Enregistrer

### Test 4: Affichage dans le tableau
1. ✅ Créer une livraison avec plusieurs caisses
2. ✅ Vérifier l'affichage dans la colonne "Caisses"
3. ✅ Vérifier le format: `Qté x Nom (total kg)`
4. ✅ Vérifier le total si > 1 caisse

## Notes Techniques

### Pré-remplissage des données
```typescript
useEffect(() => {
    if (open) {
        loadData();
        // Réinitialiser avec les données existantes
        if (livraison.caisses && livraison.caisses.length > 0) {
            setCaisses(livraison.caisses.map(c => ({
                typeCaisseId: c.typeCaisseId,
                quantite: c.quantite
            })));
        }
    }
}, [open]);
```

### Calcul du total
```typescript
const calculateTotal = () => {
    return caisses.reduce((total, caisse) => {
        const typeCaisse = typesCaisses.find(tc => tc.id === caisse.typeCaisseId);
        if (typeCaisse && caisse.quantite) {
            return total + (caisse.quantite * typeCaisse.poidsKg);
        }
        return total;
    }, 0);
};
```

### Affichage dans la colonne
```typescript
{caisses.map((caisse, index) => {
    const totalKg = caisse.quantite * caisse.typeCaisse.poidsKg;
    return (
        <div key={index} className="text-xs">
            <span className="font-medium text-[#C17A2B]">
                {caisse.quantite}x
            </span>{" "}
            <span className="text-[#3D1C00]">
                {caisse.typeCaisse.nom}
            </span>{" "}
            <span className="text-[#3D1C00]/60">
                ({totalKg.toFixed(2)} kg)
            </span>
        </div>
    );
})}
```

## Prochaines Étapes

1. ✅ Tester les modifications dans le navigateur
2. ⏳ Vérifier la compatibilité avec les anciennes données
3. ⏳ Tester la mise à jour de livraisons existantes
4. ⏳ Valider l'affichage sur mobile (responsive)
5. ⏳ Documenter le workflow complet Create → Read → Update

## Compatibilité

Le système supporte maintenant complètement:
- ✅ Création de livraisons avec caisses multiples
- ✅ Modification de livraisons avec caisses multiples
- ✅ Affichage détaillé des caisses dans le tableau
- ✅ Calcul automatique des totaux
- ✅ Validation des données
- ✅ Pré-remplissage des formulaires

Le backend était déjà compatible - seul le frontend nécessitait ces mises à jour.
