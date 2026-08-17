import { cookies } from 'next/headers';
import type { Locale } from './config';

export async function getServerLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    return (cookieStore.get('NEXT_LOCALE')?.value || 'fr') as Locale;
}

export async function getServerTranslations() {
    const locale = await getServerLocale();

    // Import the messages
    const messages = (await import(`./locales/${locale}.json`)).default;

    // Create a translation function
    const t = (key: string, params?: Record<string, string>) => {
        const keys = key.split('.');
        let value: unknown = messages;

        for (const k of keys) {
            value = value && typeof value === 'object'
                ? (value as Record<string, unknown>)[k]
                : undefined;
            if (value === undefined) return key;
        }

        // Replace parameters {param}
        if (params && typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
        }

        return typeof value === 'string' ? value : key;
    };

    return t;
}
