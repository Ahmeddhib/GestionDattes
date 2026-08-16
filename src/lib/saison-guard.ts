import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Erreurs de saison. Elles portent un `code` stable plutôt qu'un message
 * français figé : la traduction est faite par la couche action via
 * `toActionError` (src/lib/action-error.ts), qui sait quelle locale est
 * active. Le `message` reste lisible pour les logs serveur.
 */
export class AucuneSaisonOuverteError extends Error {
    readonly code = "AUCUNE_SAISON_OUVERTE" as const;
    constructor() {
        super("Aucune saison ouverte pour cette Wakala");
        this.name = "AucuneSaisonOuverteError";
    }
}

export class SaisonClotureeError extends Error {
    readonly code = "SAISON_CLOTUREE" as const;
    constructor(readonly saisonNom: string) {
        super(`La saison "${saisonNom}" est clôturée`);
        this.name = "SaisonClotureeError";
    }
}

export class SaisonIntrouvableError extends Error {
    readonly code = "SAISON_INTROUVABLE" as const;
    constructor() {
        super("Saison introuvable dans cette Wakala");
        this.name = "SaisonIntrouvableError";
    }
}

export type SaisonError = AucuneSaisonOuverteError | SaisonClotureeError | SaisonIntrouvableError;

export function isSaisonError(error: unknown): error is SaisonError {
    return (
        error instanceof AucuneSaisonOuverteError ||
        error instanceof SaisonClotureeError ||
        error instanceof SaisonIntrouvableError
    );
}

/**
 * Garde-fou unique réutilisé par tous les services métier : vérifie qu'une
 * saison existe, appartient au tenant courant, et est OUVERTE. Doit être
 * appelé avant toute création/modification/suppression de Livraison, Pesée,
 * Vente, BonAchat, PaiementAgriculteur, EncaissementClient, DepenseAutre ou
 * PretCaisse.
 *
 * C'est le seul mécanisme qui rend une saison clôturée réellement en lecture
 * seule — le masquage des boutons côté UI n'est qu'un confort.
 */
export async function assertSaisonOuverte(
    tenantId: string,
    saisonId: string,
    client: DbClient = prisma
) {
    const saison = await client.saison.findFirst({
        where: { id: saisonId, tenantId },
    });

    if (!saison) {
        throw new SaisonIntrouvableError();
    }

    if (saison.statut !== "OUVERTE") {
        throw new SaisonClotureeError(saison.nom);
    }

    return saison;
}

/**
 * Récupère la saison OUVERTE du tenant, utilisée pour rattacher automatiquement
 * toute nouvelle opération (l'utilisateur ne choisit jamais la saison lui-même).
 * Lève si aucune n'est ouverte : c'est ce qui bloque toute nouvelle opération
 * entre une clôture et la création manuelle de la saison suivante.
 */
export async function getSaisonOuverte(tenantId: string, client: DbClient = prisma) {
    const saison = await findSaisonOuverte(tenantId, client);

    if (!saison) {
        throw new AucuneSaisonOuverteError();
    }

    return saison;
}

/**
 * Variante non lançante de `getSaisonOuverte`, pour l'affichage : les pages
 * ont besoin de savoir qu'aucune saison n'est ouverte pour désactiver leurs
 * formulaires, sans que cela constitue une erreur.
 */
export async function findSaisonOuverte(tenantId: string, client: DbClient = prisma) {
    return client.saison.findFirst({
        where: { tenantId, statut: "OUVERTE" },
    });
}
