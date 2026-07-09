import { cookies } from 'next/headers';
import type { Locale } from './config';

export async function getServerTranslations() {
    const cookieStore = await cookies();
    const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'fr') as Locale;

    // Import the messages
    const messages = (await import(`./locales/${locale}.json`)).default;

    // Create a translation function
    const t = (key: string, params?: Record<string, string>) => {
        const keys = key.split('.');
        let value: any = messages;

        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) return key;
        }

        // Replace parameters {param}
        if (params && typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (_, key) => params[key] || `{${key}}`);
        }

        return value || key;
    };

    return t;
}
