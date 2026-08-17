import { getServerTranslations } from "@/i18n/server";
import { isSaisonError } from "@/lib/saison-guard";
import { estErreurConnexionBase } from "@/lib/db-error";
import { LivraisonNonSupprimableError } from "@/services/livraison-suppression.service";

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

    // Le refus de suppression doit dire CE QUI bloque, pas seulement qu'il
    // bloque : « déjà vendu » et « déjà payé » n'appellent pas la même action.
    if (error instanceof LivraisonNonSupprimableError) {
        const t = await getServerTranslations();
        const raisons = error.motifs
            .map((m) => t(`livraisons.suppression.motifs.${m.motif}`, { count: String(m.nombre) }))
            .join(" · ");
        return `${t("livraisons.suppression.refus")} ${raisons}`;
    }

    // Panne d'infrastructure : dire à l'utilisateur que la base est injoignable
    // et qu'il peut réessayer. Ces objets ne sont PAS des `Error` — l'adaptateur
    // Neon lève un `ErrorEvent` — et retombaient donc sur « Erreur inconnue »,
    // un message qui n'indiquait ni la cause ni la conduite à tenir.
    if (estErreurConnexionBase(error)) {
        const t = await getServerTranslations();
        return t("messages.error.database");
    }

    if (error instanceof Error) {
        return error.message;
    }

    // Dernier recours avant « Erreur inconnue » : beaucoup de valeurs levées
    // portent un message exploitable sans être des `Error`. Sans cela, elles
    // s'affichaient en « [object Object] ».
    if (error && typeof error === "object") {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string" && message.trim()) return message;
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
