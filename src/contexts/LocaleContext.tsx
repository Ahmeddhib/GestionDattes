"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { defaultLocale, localeDirections } from "@/i18n/config";

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    messages: any;
    t: (key: string, params?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);
    const [messages, setMessages] = useState<any>(null);

    // Charger les messages de traduction
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const mod = await import(`@/i18n/locales/${locale}.json`);
                setMessages(mod.default);
            } catch (error) {
                console.error(`Erreur chargement traductions ${locale}:`, error);
                // Fallback vers français
                const mod = await import("@/i18n/locales/fr.json");
                setMessages(mod.default);
            }
        };

        loadMessages();
    }, [locale]);

    // Initialiser la langue depuis localStorage au premier chargement
    useEffect(() => {
        const savedLocale = localStorage.getItem("preferred-locale") as Locale;
        if (savedLocale && ["fr", "ar", "en"].includes(savedLocale)) {
            setLocaleState(savedLocale);
            // Appliquer direction RTL/LTR
            document.documentElement.dir = localeDirections[savedLocale];
            document.documentElement.lang = savedLocale;
        }
    }, []);

    // Fonction pour changer de langue
    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);

        // Sauvegarder dans localStorage
        localStorage.setItem("preferred-locale", newLocale);

        // Mettre à jour la direction du document (RTL pour arabe)
        document.documentElement.dir = localeDirections[newLocale];
        document.documentElement.lang = newLocale;

        console.log("🌍 Langue changée:", newLocale);
    };

    // Fonction de traduction
    const t = (key: string, params?: Record<string, string>): string => {
        if (!messages) return key;

        const keys = key.split(".");
        let value: any = messages;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        // Remplacer les paramètres {param}
        if (params && typeof value === "string") {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) => params[paramKey] || `{${paramKey}}`);
        }

        return value || key;
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
