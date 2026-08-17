"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { defaultLocale, localeDirections } from "@/i18n/config";
import { useRouter } from "next/navigation";

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
    const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

    // Charger les messages de traduction
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const mod = await import(`@/i18n/locales/${locale}.json`);
                setMessages(mod.default as Record<string, unknown>);
            } catch (error) {
                console.error(`Erreur chargement traductions ${locale}:`, error);
                // Fallback vers français
                const mod = await import("@/i18n/locales/fr.json");
                setMessages(mod.default as Record<string, unknown>);
            }
        };

        loadMessages();
    }, [locale]);

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
