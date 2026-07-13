# 🌍 Guide du Changement de Langue Instantané

## 📚 Vue d'ensemble

Ce document explique comment fonctionne le système de changement de langue **sans rechargement de page** dans le projet Gestion Dattes.

---

## ✨ Fonctionnalités

- ✅ **Changement instantané** : Pas de `window.location.reload()`
- ✅ **Context React** : Gestion d'état globale avec LocaleContext
- ✅ **Support RTL** : Bascule automatique pour l'arabe
- ✅ **Persistence** : Sauvegarde dans localStorage
- ✅ **3 langues** : Français 🇫🇷, Arabe 🇹🇳, Anglais 🇬🇧

---

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── contexts/
│   └── LocaleContext.tsx         # Context Provider pour la langue
├── hooks/
│   └── useClientTranslations.ts  # Hook simplifié utilisant le contexte
├── components/
│   └── shared/
│       └── LanguageSwitcher.tsx  # Composant UI de sélection
├── i18n/
│   ├── config.ts                 # Configuration i18n
│   └── locales/
│       ├── fr.json               # Traductions françaises
│       ├── ar.json               # Traductions arabes
│       └── en.json               # Traductions anglaises
└── app/
    └── layout.tsx                # Enveloppé avec LocaleProvider
```

---

## 🔧 Comment ça fonctionne

### 1. LocaleContext Provider

Le **LocaleContext** gère l'état global de la langue :

```typescript
// src/contexts/LocaleContext.tsx
export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [messages, setMessages] = useState<any>(null);

  // Charger les traductions dynamiquement
  useEffect(() => {
    const loadMessages = async () => {
      const mod = await import(`@/i18n/locales/${locale}.json`);
      setMessages(mod.default);
    };
    loadMessages();
  }, [locale]);

  // Fonction pour changer de langue
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("preferred-locale", newLocale);
    
    // Mettre à jour direction RTL/LTR
    document.documentElement.dir = localeDirections[newLocale];
    document.documentElement.lang = newLocale;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages, t }}>
      {children}
    </LocaleContext.Provider>
  );
}
```

**Points clés** :
- ✅ État centralisé pour `locale` et `messages`
- ✅ Chargement dynamique des fichiers JSON
- ✅ Mise à jour automatique de la direction du document (RTL/LTR)
- ✅ Persistence dans localStorage

### 2. Hook useClientTranslations

Hook simplifié qui utilise le contexte :

```typescript
// src/hooks/useClientTranslations.ts
export function useClientTranslations() {
  const { t, locale, messages } = useLocale();
  return { t, locale, messages };
}
```

**Avant** :
- ❌ Gérait son propre état local
- ❌ Écoutait des événements `localeChange`
- ❌ Rechargeait les messages à chaque changement

**Après** :
- ✅ Utilise le contexte global
- ✅ Plus besoin d'événements
- ✅ Réactivité automatique

### 3. LanguageSwitcher

Composant UI pour changer de langue :

```typescript
// src/components/shared/LanguageSwitcher.tsx
export function LanguageSwitcher() {
  const { locale: currentLocale, setLocale } = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale); // ✨ C'est tout ! Pas de reload !
  };

  return (
    <DropdownMenu>
      {/* UI pour sélectionner la langue */}
    </DropdownMenu>
  );
}
```

**Avant** :
- ❌ `window.location.reload()` après changement
- ❌ Perte de l'état de l'application

**Après** :
- ✅ Changement instantané
- ✅ Conservation de l'état
- ✅ Expérience fluide

### 4. Root Layout

Enveloppe toute l'application avec le provider :

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <LocaleProvider>
          {children}
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
```

---

## 📖 Utilisation

### Dans un composant client

```typescript
"use client";

import { useClientTranslations } from "@/hooks/useClientTranslations";

export function MonComposant() {
  const { t, locale } = useClientTranslations();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("common.welcome")}</p>
      <p>Langue actuelle : {locale}</p>
    </div>
  );
}
```

### Changer de langue programmatiquement

```typescript
"use client";

import { useLocale } from "@/contexts/LocaleContext";

export function LanguageButton() {
  const { setLocale } = useLocale();

  return (
    <button onClick={() => setLocale("ar")}>
      Passer en arabe
    </button>
  );
}
```

### Traduction avec paramètres

```typescript
const { t } = useClientTranslations();

// JSON: "welcome": "Bienvenue {name} !"
const message = t("common.welcome", { name: "Ahmed" });
// Résultat: "Bienvenue Ahmed !"
```

---

## 🔄 Flux de changement de langue

```
1. Utilisateur clique sur une langue dans LanguageSwitcher
   ↓
2. handleLocaleChange() appelle setLocale(newLocale)
   ↓
3. LocaleContext met à jour l'état locale
   ↓
4. useEffect() détecte le changement et charge le nouveau JSON
   ↓
5. setMessages() met à jour les traductions
   ↓
6. Tous les composants utilisant useClientTranslations() 
   sont re-rendus AUTOMATIQUEMENT avec les nouvelles traductions
   ↓
7. Direction du document mise à jour (RTL pour arabe)
   ↓
8. Langue sauvegardée dans localStorage
   ↓
9. ✨ AUCUN RECHARGEMENT DE PAGE !
```

---

## 🎨 Support RTL (Right-to-Left)

### Détection automatique

```typescript
// Dans LocaleContext
const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  ar: 'rtl',  // ← Arabe en RTL
  en: 'ltr',
};

// Application automatique
document.documentElement.dir = localeDirections[newLocale];
```

### Classes CSS pour RTL

```css
/* globals.css */
html[dir="rtl"] {
  /* Styles spécifiques RTL */
}

/* Tailwind automatique */
.rtl:text-right  /* En mode RTL */
.ltr:text-left   /* En mode LTR */
```

---

## 💾 Persistence

### Sauvegarde automatique

```typescript
// Lors du changement de langue
localStorage.setItem("preferred-locale", newLocale);
```

### Restauration au chargement

```typescript
// Dans LocaleProvider useEffect
const savedLocale = localStorage.getItem("preferred-locale") as Locale;
if (savedLocale && ["fr", "ar", "en"].includes(savedLocale)) {
  setLocaleState(savedLocale);
}
```

**Résultat** :
- ✅ La langue est conservée entre les sessions
- ✅ Rechargement de page = même langue
- ✅ Fonctionne même hors ligne

---

## 🐛 Debugging

### Logs activés

```typescript
// Dans LocaleContext setLocale()
console.log("🌍 Langue changée:", newLocale);
```

### Vérifier l'état actuel

```typescript
const { locale, messages } = useClientTranslations();
console.log("Locale actuelle:", locale);
console.log("Messages chargés:", messages ? "✓" : "✗");
```

### Vérifier localStorage

```javascript
// Dans la console du navigateur
localStorage.getItem("preferred-locale");
// Résultat: "fr" | "ar" | "en"
```

---

## ⚡ Performance

### Optimisations

1. **Import dynamique** :
   ```typescript
   const mod = await import(`@/i18n/locales/${locale}.json`);
   ```
   → Charge seulement le JSON nécessaire

2. **Context React** :
   → Un seul re-render par composant qui utilise `t()`

3. **localStorage** :
   → Pas besoin de fetch au chargement

### Comparaison

| Méthode | Temps changement | Recharge page | État préservé |
|---------|------------------|---------------|---------------|
| **Avant** (avec reload) | ~1-3s | ✅ Oui | ❌ Non |
| **Après** (Context) | ~50-100ms | ❌ Non | ✅ Oui |

---

## 🔍 Différences avec l'ancienne méthode

### Ancienne méthode (avec reload)

```typescript
// ❌ AVANT
const handleLocaleChange = (newLocale) => {
  localStorage.setItem("preferred-locale", newLocale);
  window.dispatchEvent(new Event("localeChange"));
  window.location.reload(); // ← Problème !
};
```

**Problèmes** :
- ❌ Rechargement complet de la page
- ❌ Perte de l'état de l'application
- ❌ Mauvaise expérience utilisateur
- ❌ Temps d'attente (1-3 secondes)

### Nouvelle méthode (Context)

```typescript
// ✅ APRÈS
const handleLocaleChange = (newLocale) => {
  setLocale(newLocale); // ← Simple et efficace !
};
```

**Avantages** :
- ✅ Changement instantané (< 100ms)
- ✅ État de l'application préservé
- ✅ Expérience utilisateur fluide
- ✅ Pas de perte de données de formulaires
- ✅ Pas de re-fetch des données

---

## 🚀 Améliorations futures possibles

1. **Animation de transition** :
   ```typescript
   // Ajouter une transition CSS
   document.body.style.opacity = "0.5";
   await setLocale(newLocale);
   document.body.style.opacity = "1";
   ```

2. **Détection automatique de la langue** :
   ```typescript
   const browserLocale = navigator.language.split("-")[0];
   if (["fr", "ar", "en"].includes(browserLocale)) {
     setLocale(browserLocale);
   }
   ```

3. **Préchargement des traductions** :
   ```typescript
   // Charger toutes les langues au démarrage
   const preloadTranslations = async () => {
     await Promise.all([
       import("@/i18n/locales/fr.json"),
       import("@/i18n/locales/ar.json"),
       import("@/i18n/locales/en.json"),
     ]);
   };
   ```

---

## 📌 Résumé

| Aspect | Solution |
|--------|----------|
| **State Management** | Context React |
| **Persistence** | localStorage |
| **RTL Support** | Automatique via `document.dir` |
| **Performance** | Import dynamique |
| **UX** | Changement instantané sans reload |

---

## 🔗 Ressources

- [React Context API](https://react.dev/reference/react/useContext)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [RTL Styling Guide](https://rtlstyling.com/)

---

**Dernière mise à jour** : Juillet 2026
**Auteur** : Équipe Gestion Dattes
