"use client";

import { useState, useEffect } from 'react';
import type { Locale } from '@/i18n/config';

export function useClientTranslations() {
    const [locale, setLocale] = useState<Locale>('fr');
    const [messages, setMessages] = useState<any>(null);

    useEffect(() => {
        const loadMessages = async () => {
            const savedLocale = (localStorage.getItem('preferred-locale') || 'fr') as Locale;
            setLocale(savedLocale);

            try {
                const mod = await import(`@/i18n/locales/${savedLocale}.json`);
                setMessages(mod.default);
            } catch (error) {
                // Fallback to French
                const mod = await import('@/i18n/locales/fr.json');
                setMessages(mod.default);
            }
        };

        loadMessages();

        // Écouter les changements de langue
        const handleLocaleChange = () => {
            loadMessages();
        };

        window.addEventListener('localeChange', handleLocaleChange);
        return () => window.removeEventListener('localeChange', handleLocaleChange);
    }, []);

    const t = (key: string, params?: Record<string, string>) => {
        if (!messages) return key;

        const keys = key.split('.');
        let value: any = messages;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        // Remplacer les paramètres {param}
        if (params && typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
        }

        return value || key;
    };

    return { t, locale, messages };
}
