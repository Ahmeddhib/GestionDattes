import { getServerTranslations } from "@/i18n/server";
import { isSaisonError } from "@/lib/saison-guard";

/**
 * Traduit une erreur remontée d'un service en message affichable dans la
 * langue active. Les erreurs de saison portent un code stable (voir
 * `src/lib/saison-guard.ts`) : c'est ici, et seulement ici, qu'il devient
 * une phrase — les services ne connaissent pas la locale.
 *
 * Toute autre erreur retombe sur son propre message, comme avant.
 */
export async function resolveActionErrorMessage(error: unknown): Promise<string> {
    if (isSaisonError(error)) {
        const t = await getServerTranslations();

        switch (error.code) {
            case "AUCUNE_SAISON_OUVERTE":
                return t("finance.saisons.errors.aucuneSaisonOuverte");
            case "SAISON_CLOTUREE":
                return t("finance.saisons.errors.saisonCloturee", { nom: error.saisonNom });
            case "SAISON_INTROUVABLE":
                return t("finance.saisons.errors.saisonIntrouvable");
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Erreur inconnue";
}

/**
 * Raccourci pour les `catch` des Server Actions, qui renvoient toutes la
 * même forme `{ success: false, error }`.
 */
export async function toActionError(error: unknown): Promise<{
    success: false;
    error: string;
    errorCode?: string;
}> {
    return {
        success: false,
        error: await resolveActionErrorMessage(error),
        ...(isSaisonError(error) && { errorCode: error.code }),
    };
}
