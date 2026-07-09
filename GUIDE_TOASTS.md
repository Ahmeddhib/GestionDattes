# 🎉 Guide Complet des Toasts avec Sonner

Ce guide vous montre comment utiliser les toasts (notifications) dans votre application.

## ✅ Configuration (Déjà faite!)

Le Toaster est maintenant configuré dans `src/app/layout.tsx` et apparaîtra en haut à droite de l'écran.

## 📝 Comment Utiliser les Toasts

### 1. Importer le toast

```typescript
import { toast } from "sonner";
```

### 2. Types de Toasts Disponibles

#### ✅ **Toast de Succès**
```typescript
// Simple
toast.success("Opération réussie!");

// Avec traduction
toast.success(t("messages.success.created", { entity: t("agriculteurs.title") }));
```

#### ❌ **Toast d'Erreur**
```typescript
// Simple
toast.error("Une erreur est survenue");

// Avec traduction
toast.error(t("messages.error.generic"));
```

#### ℹ️ **Toast d'Information**
```typescript
toast.info("Information importante");
```

#### ⚠️ **Toast d'Avertissement**
```typescript
toast.warning("Attention!");
```

#### ⏳ **Toast de Chargement**
```typescript
// Créer un toast de chargement
const toastId = toast.loading("Chargement en cours...");

// Plus tard, le mettre à jour
toast.success("Terminé!", { id: toastId });
```

## 🎯 Exemples Pratiques

### Exemple 1: Création d'un Agriculteur

```typescript
const onSubmit = async (data: CreateAgriculteurInput) => {
    try {
        setIsLoading(true);

        const result = await createAgriculteurAction(data);

        if (!result.success) {
            // Toast d'erreur si échec
            toast.error(result.error || t("messages.error.generic"));
            return;
        }

        // Toast de succès
        toast.success(t("messages.success.created", { entity: t("agriculteurs.title") }));
        
        form.reset();
        setOpen(false);
        router.refresh();
    } catch (error) {
        console.error("Erreur:", error);
        toast.error(t("messages.error.generic"));
    } finally {
        setIsLoading(false);
    }
};
```

### Exemple 2: Modification d'un Agriculteur

```typescript
const onSubmit = async (data: UpdateAgriculteurInput) => {
    try {
        setIsLoading(true);

        const result = await updateAgriculteurAction(agriculteur.id, data);

        if (!result.success) {
            toast.error(result.error || t("messages.error.generic"));
            return;
        }

        // Toast de succès avec message personnalisé
        toast.success(t("messages.success.updated", { entity: t("agriculteurs.title") }));
        
        setOpen(false);
        router.refresh();
    } catch (error) {
        console.error("Erreur:", error);
        toast.error(t("messages.error.generic"));
    } finally {
        setIsLoading(false);
    }
};
```

### Exemple 3: Suppression d'un Agriculteur

```typescript
const handleDelete = async () => {
    try {
        setIsLoading(true);

        const result = await deleteAgriculteurAction(agriculteur.id);

        if (!result.success) {
            toast.error(result.error || t("messages.error.generic"));
            return;
        }

        // Toast de succès pour suppression
        toast.success(t("messages.success.deleted", { entity: t("agriculteurs.title") }));
        
        setOpen(false);
        router.refresh();
    } catch (error) {
        console.error("Erreur:", error);
        toast.error(t("messages.error.generic"));
    } finally {
        setIsLoading(false);
    }
};
```

### Exemple 4: Toast avec Durée Personnalisée

```typescript
// Toast qui reste visible pendant 5 secondes
toast.success("Opération réussie!", {
    duration: 5000
});

// Toast qui reste visible indéfiniment (nécessite fermeture manuelle)
toast.success("Important: Lisez ceci!", {
    duration: Infinity
});
```

### Exemple 5: Toast avec Actions

```typescript
toast.success("Agriculteur créé!", {
    action: {
        label: "Voir",
        onClick: () => router.push(`/dashboard/agriculteurs/${newId}`)
    }
});
```

### Exemple 6: Toast avec Description

```typescript
toast.success("Agriculteur créé avec succès!", {
    description: `Code: AGR-0001, Nom: ${nom} ${prenom}`
});
```

## 🎨 Personnalisation

### Position du Toaster (déjà configuré)

```typescript
<Toaster position="top-right" richColors />
```

Positions disponibles:
- `top-left`
- `top-center`
- `top-right` ← Actuellement utilisé
- `bottom-left`
- `bottom-center`
- `bottom-right`

### Avec Rich Colors (déjà activé)

```typescript
<Toaster richColors />
```

Cela donne des couleurs plus vives et attrayantes pour chaque type de toast.

## 📋 Messages de Traduction

Les messages sont déjà configurés dans `src/i18n/locales/*.json`:

```json
{
  "messages": {
    "success": {
      "created": "{entity} créé(e) avec succès",
      "updated": "{entity} mis(e) à jour avec succès",
      "deleted": "{entity} supprimé(e) avec succès"
    },
    "error": {
      "generic": "Une erreur est survenue",
      "notFound": "{entity} introuvable",
      "alreadyExists": "{entity} existe déjà",
      "cannotDelete": "Impossible de supprimer {entity}"
    }
  }
}
```

### Utilisation avec traductions:

```typescript
// Succès
toast.success(t("messages.success.created", { entity: t("agriculteurs.title") }));
// Affiche: "Agriculteurs créé(e) avec succès"

// Erreur
toast.error(t("messages.error.generic"));
// Affiche: "Une erreur est survenue"
```

## 🔥 Astuces Pro

### 1. Toast avec Promise

```typescript
const promise = createAgriculteurAction(data);

toast.promise(promise, {
    loading: "Création en cours...",
    success: "Agriculteur créé!",
    error: "Erreur lors de la création"
});
```

### 2. Fermer un Toast Programmatiquement

```typescript
const toastId = toast.success("Message");

// Plus tard...
toast.dismiss(toastId);

// Ou fermer tous les toasts
toast.dismiss();
```

### 3. Toast Personnalisé

```typescript
toast.custom((t) => (
    <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-[#C17A2B]">
        <h3 className="font-bold text-[#3D1C00]">Agriculteur créé!</h3>
        <p className="text-sm text-gray-600">Code: AGR-0001</p>
        <button 
            onClick={() => toast.dismiss(t)}
            className="mt-2 text-[#C17A2B] text-sm"
        >
            Fermer
        </button>
    </div>
));
```

## ✨ Résumé

- ✅ **Toaster configuré** dans le layout principal
- ✅ **4 types de toasts** : success, error, info, warning
- ✅ **Position** : top-right avec rich colors
- ✅ **Traductions** : Support multilingue intégré
- ✅ **Personnalisable** : Durée, actions, descriptions

Tous vos formulaires utilisent déjà les toasts correctement! 🎉
