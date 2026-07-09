# Validation des Formulaires avec Messages d'Erreur Rouges - 06/07/2026

## Résumé
Implémentation de la validation côté client dans les formulaires avec affichage des messages d'erreur en rouge utilisant React Hook Form et Zod.

## Technologies Utilisées

- **React Hook Form** - Gestion des formulaires performante
- **Zod** - Schéma de validation TypeScript-first
- **@hookform/resolvers** - Intégration Zod avec React Hook Form
- **shadcn/ui Form** - Composants de formulaire accessibles

## Modifications Effectuées

### 1. Création du Composant Form UI

**Fichier créé** : `src/components/ui/form.tsx`

Composants exportés :
- `Form` - Provider pour le contexte du formulaire
- `FormField` - Wrapper pour les champs contrôlés
- `FormItem` - Container pour chaque champ
- `FormLabel` - Label avec gestion automatique des erreurs (texte rouge)
- `FormControl` - Wrapper pour les inputs avec aria-attributes
- `FormMessage` - Affiche les messages d'erreur en rouge
- `FormDescription` - Description optionnelle du champ

**Fonctionnalités** :
- Gestion automatique des IDs et aria-attributes pour l'accessibilité
- Messages d'erreur en rouge (`text-red-600`)
- Labels en rouge quand erreur
- Hook `useFormField()` pour accéder à l'état du champ

### 2. Mise à Jour de CreatePretDialog

**Fichier modifié** : `src/components/features/stock-caisses/CreatePretDialog.tsx`

#### Schéma de Validation Zod

```typescript
const formSchema = z.object({
    agriculteurId: z.string({
        required_error: t("validation.required"),
    }).min(1, t("validation.required")),
    
    typeCaisseId: z.string({
        required_error: t("validation.required"),
    }).min(1, t("validation.required")),
    
    nombrePrete: z.coerce
        .number({
            required_error: t("validation.required"),
            invalid_type_error: t("validation.integer"),
        })
        .int(t("validation.integer"))
        .min(1, t("validation.minValue").replace("{min}", "1"))
        .max(stockMax, `${t("pretsCaisses.stockInsuffisant")} (Max: ${stockMax})`),
    
    observations: z.string().optional(),
});
```

#### Règles de Validation

1. **Agriculteur** (agriculteurId)
   - ✅ Champ obligatoire
   - ✅ Message : "Ce champ est requis"

2. **Type de Caisse** (typeCaisseId)
   - ✅ Champ obligatoire
   - ✅ Message : "Ce champ est requis"

3. **Nombre de Caisses** (nombrePrete)
   - ✅ Champ obligatoire
   - ✅ Doit être un nombre entier
   - ✅ Minimum : 1
   - ✅ Maximum : Stock disponible dynamique
   - ✅ Messages personnalisés selon l'erreur

4. **Observations** (observations)
   - ✅ Champ optionnel

#### Validation Dynamique du Stock

```typescript
const watchTypeCaisse = form.watch("typeCaisseId");
useEffect(() => {
    if (watchTypeCaisse) {
        const type = typesCaisses.find(t => t.id === watchTypeCaisse);
        const newStockMax = type?.stockDisponible || 0;
        setStockMax(newStockMax);
        
        // Revalider si le nombre dépasse le nouveau max
        const currentValue = form.getValues("nombrePrete");
        if (currentValue && currentValue > newStockMax) {
            form.trigger("nombrePrete");
        }
    }
}, [watchTypeCaisse, typesCaisses, form]);
```

**Comportement** :
- Quand l'utilisateur change de type de caisse, le stock max est mis à jour
- Si le nombre déjà saisi dépasse le nouveau max, l'erreur s'affiche immédiatement
- Le bouton submit est désactivé si stock = 0

### 3. Affichage des Erreurs

#### Messages d'Erreur en Rouge

Chaque champ affiche son erreur sous le champ en rouge :

```tsx
<FormField
    control={form.control}
    name="nombrePrete"
    render={({ field }) => (
        <FormItem>
            <FormLabel className="text-[#3D1C00]">
                {t("pretsCaisses.nombrePrete")}
            </FormLabel>
            <FormControl>
                <Input type="number" {...field} />
            </FormControl>
            <FormMessage className="text-red-600 text-xs" />
        </FormItem>
    )}
/>
```

#### Exemples de Messages d'Erreur

| Erreur | Message Affiché (FR) | Couleur |
|--------|---------------------|---------|
| Champ vide | Ce champ est requis | 🔴 Rouge |
| Nombre invalide | Doit être un nombre entier | 🔴 Rouge |
| Nombre < 1 | Doit être au moins 1 | 🔴 Rouge |
| Nombre > stock | Stock insuffisant (Max: 50) | 🔴 Rouge |

### 4. Gestion du Formulaire

#### Réinitialisation Automatique

- Quand le dialog se ferme, le formulaire est réinitialisé
- Les erreurs sont effacées
- Le stock max est remis à 0

```typescript
const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
        form.reset();
        setStockMax(0);
    }
};
```

#### Soumission avec Validation

```typescript
async function onSubmit(data: FormData) {
    setLoading(true);
    
    // Créer FormData pour l'action serveur
    const formData = new FormData();
    formData.append("agriculteurId", data.agriculteurId);
    formData.append("typeCaisseId", data.typeCaisseId);
    formData.append("nombrePrete", data.nombrePrete.toString());
    if (data.observations) {
        formData.append("observations", data.observations);
    }

    const result = await createPretAction(formData);
    // ...
}
```

## Avantages de Cette Approche

### 1. Expérience Utilisateur Améliorée
- ✅ Validation en temps réel
- ✅ Messages d'erreur clairs et visibles (rouge)
- ✅ Feedback immédiat lors de la saisie
- ✅ Pas de soumission de formulaire invalide

### 2. Accessibilité
- ✅ Attributs ARIA automatiques
- ✅ Association label-input-error
- ✅ Annonce des erreurs par les lecteurs d'écran
- ✅ Navigation clavier optimisée

### 3. Maintenabilité
- ✅ Validation centralisée avec Zod
- ✅ Type-safe avec TypeScript
- ✅ Messages d'erreur traduits
- ✅ Code réutilisable

### 4. Performance
- ✅ Validation côté client (pas d'appel serveur)
- ✅ Re-renders optimisés avec React Hook Form
- ✅ Validation déclenchée uniquement quand nécessaire

## Clés de Traduction Utilisées

Les messages d'erreur utilisent les clés existantes dans `validation` :

```json
{
  "validation": {
    "required": "Ce champ est requis",
    "integer": "Doit être un nombre entier",
    "minValue": "Doit être au moins {min}",
    "positive": "Doit être un nombre positif"
  },
  "pretsCaisses": {
    "stockInsuffisant": "Stock insuffisant"
  }
}
```

## Tests à Effectuer

### Scénarios de Test

1. **Champs vides**
   - ✅ Soumettre sans remplir → Messages rouges s'affichent
   - ✅ Remplir agriculteur → Erreur disparaît

2. **Nombre invalide**
   - ✅ Saisir 0 → "Doit être au moins 1"
   - ✅ Saisir texte → "Doit être un nombre entier"
   - ✅ Saisir nombre négatif → "Doit être au moins 1"

3. **Stock insuffisant**
   - ✅ Choisir type avec stock 10
   - ✅ Saisir 15 → "Stock insuffisant (Max: 10)"
   - ✅ Saisir 8 → Erreur disparaît

4. **Changement dynamique**
   - ✅ Choisir type A (stock 50), saisir 30
   - ✅ Changer pour type B (stock 20)
   - ✅ → Erreur apparaît automatiquement

5. **Réinitialisation**
   - ✅ Remplir avec erreurs
   - ✅ Fermer dialog
   - ✅ Rouvrir → Formulaire vide, pas d'erreurs

## Styles des Messages d'Erreur

### Classe CSS Utilisée

```css
.text-red-600 {
  color: rgb(220, 38, 38);
}
```

### Taille et Position

- **Taille** : `text-xs` (12px)
- **Position** : Sous le champ concerné
- **Espacement** : `space-y-2` (8px entre label, input, message)

### Exemple Visuel

```
┌─────────────────────────────┐
│ Nombre de caisses (Max: 50) │ ← Label normal
├─────────────────────────────┤
│ [      150      ]           │ ← Input avec valeur invalide
└─────────────────────────────┘
  Stock insuffisant (Max: 50)   ← Message rouge (text-red-600)
```

## Prochaines Étapes

### Autres Formulaires à Valider

Appliquer la même approche à :
- ✅ CreatePretDialog (fait !)
- ⏳ RetourDialog
- ⏳ CreateRegionDialog
- ⏳ CreateAgriculteurDialog  
- ⏳ CreateTypeCaisseDialog
- ⏳ CreateLivraisonDialog
- ⏳ CreateUserDialog
- ⏳ CreateRoleDialog

### Pattern à Suivre

Pour chaque formulaire :
1. Créer un schéma Zod avec messages traduits
2. Utiliser React Hook Form avec `zodResolver`
3. Remplacer les inputs standards par `FormField`
4. Ajouter `<FormMessage />` sous chaque champ
5. Gérer la réinitialisation du formulaire

## Notes Importantes

- Les messages d'erreur sont **toujours en rouge** (`text-red-600`)
- La validation est **côté client** (pas de latence réseau)
- Les erreurs **disparaissent automatiquement** quand corrigées
- Le formulaire **ne peut pas être soumis** s'il y a des erreurs
- Compatible avec **toutes les langues** (FR, EN, AR)
