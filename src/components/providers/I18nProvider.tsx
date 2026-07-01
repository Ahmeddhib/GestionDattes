"use client";

import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect } from 'react';
import type { Locale } from '@/i18n/config';

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('fr');
    const [messages, setMessages] = useState<any>(null);

    useEffect(() => {
        // Récupérer la langue depuis localStorage
        const savedLocale = (localStorage.getItem('preferred-locale') || 'fr') as Locale;
        setLocale(savedLocale);

        // Charger les messages
        import(`@/i18n/locales/${savedLocale}.json`)
            .then((mod) => setMessages(mod.default))
            .catch(() => {
                // Fallback vers français
                import('@/i18n/locales/fr.json').then((mod) => setMessages(mod.default));
            });

        // Appliquer la direction
        document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLocale;
    }, []);

    // Écouter les changements de langue
    useEffect(() => {
        const handleStorageChange = () => {
            const newLocale = (localStorage.getItem('preferred-locale') || 'fr') as Locale;
            if (newLocale !== locale) {
                setLocale(newLocale);
                import(`@/i18n/locales/${newLocale}.json`)
                    .then((mod) => setMessages(mod.default));
                document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = newLocale;
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('localeChange', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('localeChange', handleStorageChange);
        };
    }, [locale]);

    if (!messages) {
        return <>{children}</>;
    }

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
