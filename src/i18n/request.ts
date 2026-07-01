import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
    // Récupérer la langue depuis les cookies
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

    return {
        locale,
        messages: (await import(`./locales/${locale}.json`)).default
    };
});
