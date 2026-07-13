"use client";

import { useLocale } from "@/contexts/LocaleContext";

/**
 * Hook pour accéder aux traductions côté client
 * Utilise le LocaleContext pour un changement de langue sans refresh
 */
export function useClientTranslations() {
    const { t, locale, messages } = useLocale();

    return { t, locale, messages };
}
