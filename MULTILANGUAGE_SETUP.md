# 🌐 Configuration Multi-Langue (Français, Arabe, Anglais)

## 📦 Installation

```bash
bun add next-intl
```

## 🏗️ Structure des Fichiers

```
src/
├── i18n/
│   ├── locales/
│   │   ├── fr.json      # Français
│   │   ├── ar.json      # العربية
│   │   └── en.json      # English
│   ├── config.ts        # Configuration i18n
│   └── request.ts       # Server-side locale detection
├── components/
│   └── shared/
│       └── LanguageSwitcher.tsx  # Sélecteur de langue
└── middleware.ts        # Détection automatique de la langue
```

## 📝 Étapes d'Installation

### 1. Installer next-intl

```bash
bun add next-intl
```

### 2. Créer les fichiers de traduction

**`src/i18n/locales/fr.json`** (Français)
**`src/i18n/locales/ar.json`** (العربية)
**`src/i18n/locales/en.json`** (English)

### 3. Configuration i18n

**`src/i18n/config.ts`**
```typescript
export const locales = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ar: 'العربية',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  ar: '🇹🇳',
  en: '🇬🇧',
};
```

### 4. Middleware pour détection automatique

**`src/middleware.ts`** (ou renommer `proxy.ts`)
```typescript
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /fr/dashboard ou /dashboard (pour fr)
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 5. Layout Root avec Provider

**`src/app/[locale]/layout.tsx`**
```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 6. Utilisation dans les Composants

#### Composant Client
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

#### Composant Server
```typescript
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('dashboard');
  
  return <h1>{t('title')}</h1>;
}
```

### 7. Sélecteur de Langue

**`src/components/shared/LanguageSwitcher.tsx`**
```typescript
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, localeFlags } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <Select value={locale} onValueChange={switchLocale}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeFlags[loc]} {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## 🎨 Support RTL (Arabe)

### CSS Automatique
```css
/* globals.css */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}
```

### Tailwind RTL
```typescript
// tailwind.config.ts
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
};
```

## 📚 Exemple de Traductions

### `fr.json`
```json
{
  "common": {
    "welcome": "Bienvenue",
    "logout": "Déconnexion",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "create": "Créer",
    "search": "Rechercher"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "regions": "Régions",
    "agriculteurs": "Agriculteurs",
    "users": "Utilisateurs",
    "roles": "Rôles"
  },
  "regions": {
    "title": "Régions",
    "description": "Gestion des régions de production de dattes",
    "total": "Total Régions",
    "createNew": "Nouvelle Région",
    "name": "Nom de la région",
    "code": "Code"
  }
}
```

### `ar.json`
```json
{
  "common": {
    "welcome": "مرحبا",
    "logout": "تسجيل الخروج",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "create": "إنشاء",
    "search": "بحث"
  },
  "dashboard": {
    "title": "لوحة التحكم",
    "regions": "المناطق",
    "agriculteurs": "الفلاحون",
    "users": "المستخدمون",
    "roles": "الأدوار"
  },
  "regions": {
    "title": "المناطق",
    "description": "إدارة مناطق إنتاج التمور",
    "total": "إجمالي المناطق",
    "createNew": "منطقة جديدة",
    "name": "اسم المنطقة",
    "code": "الرمز"
  }
}
```

### `en.json`
```json
{
  "common": {
    "welcome": "Welcome",
    "logout": "Logout",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search"
  },
  "dashboard": {
    "title": "Dashboard",
    "regions": "Regions",
    "agriculteurs": "Farmers",
    "users": "Users",
    "roles": "Roles"
  },
  "regions": {
    "title": "Regions",
    "description": "Date production regions management",
    "total": "Total Regions",
    "createNew": "New Region",
    "name": "Region name",
    "code": "Code"
  }
}
```

## 🚀 Migration Progressive

1. **Étape 1** : Installer next-intl et créer les fichiers de configuration
2. **Étape 2** : Créer les 3 fichiers JSON avec les traductions de base
3. **Étape 3** : Migrer le layout root pour supporter [locale]
4. **Étape 4** : Ajouter le LanguageSwitcher dans TopBar
5. **Étape 5** : Remplacer progressivement les textes hardcodés par `t('key')`

## 🔧 URLs avec Locale

```
Avant:
/dashboard
/dashboard/regions
/dashboard/agriculteurs

Après:
/fr/dashboard
/ar/dashboard (RTL)
/en/dashboard
```

## ✅ Avantages

- ✅ Support RTL natif pour l'arabe
- ✅ SEO-friendly (URLs localisées)
- ✅ Type-safe avec TypeScript
- ✅ Changement de langue sans recharger la page
- ✅ Direction automatique (LTR/RTL)
- ✅ Traductions côté serveur et client

---

**Voulez-vous que je crée tous les fichiers maintenant ?** 🚀
