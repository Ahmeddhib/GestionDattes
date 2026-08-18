"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { defaultLocale, localeDirections } from "@/i18n/config";
import { useRouter } from "next/navigation";
import frMessages from "@/i18n/locales/fr.json";
import enMessages from "@/i18n/locales/en.json";
import arMessages from "@/i18n/locales/ar.json";

const messagesByLocale: Record<Locale, Record<string, unknown>> = {
    fr: frMessages,
    en: enMessages,
    ar: arMessages,
};

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    messages: Record<string, unknown> | null;
    t: (key: string, params?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children, initialLocale = defaultLocale }: { children: ReactNode; initialLocale?: Locale }) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    // Les trois petits dictionnaires sont déjà dans le bundle : le changement
    // est synchrone et ne laisse plus les KPI dans l'ancienne langue.
    const messages = messagesByLocale[locale] ?? messagesByLocale[defaultLocale];

    // Fonction pour changer de langue
    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);

        // Sauvegarder dans localStorage
        localStorage.setItem("preferred-locale", newLocale);
        document.cookie = `NEXT_LOCALE=${newLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;

        // Mettre à jour la direction du document (RTL pour arabe)
        document.documentElement.dir = localeDirections[newLocale];
        document.documentElement.lang = newLocale;

        router.refresh();
    };

    // Fonction de traduction
    const t = (key: string, params?: Record<string, string>): string => {
        if (!messages) return key;

        const keys = key.split(".");
        let value: unknown = messages;

        for (const k of keys) {
            value = value && typeof value === "object"
                ? (value as Record<string, unknown>)[k]
                : undefined;
            if (value === undefined) return key;
        }

        // Remplacer les paramètres {param}
        if (params && typeof value === "string") {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) => params[paramKey] || `{${paramKey}}`);
        }

        return typeof value === "string" ? value : key;
    };

    return (
        <LocaleContext.Provider value={{ locale, setLocale, messages, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

// Hook personnalisé pour utiliser le contexte
export function useLocale() {
    const context = useContext(LocaleContext);
    if (context === undefined) {
        throw new Error("useLocale doit être utilisé dans un LocaleProvider");
    }
    return context;
}
