import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Garde-fou unique réutilisé par tous les services métier : vérifie qu'une
 * saison existe, appartient au tenant courant, et est OUVERTE. Doit être
 * appelé avant toute création/modification de Livraison, Vente, BonAchat,
 * PaiementAgriculteur, EncaissementClient ou DepenseAutre.
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
        throw new Error("Saison introuvable dans cette Wakala");
    }

    if (saison.statut !== "OUVERTE") {
        throw new Error(
            `Impossible d'effectuer cette opération : la saison "${saison.nom}" est clôturée`
        );
    }

    return saison;
}

/**
 * Récupère la saison OUVERTE du tenant, utilisée pour rattacher automatiquement
 * toute nouvelle opération (l'utilisateur ne choisit jamais la saison lui-même).
 */
export async function getSaisonOuverte(tenantId: string, client: DbClient = prisma) {
    const saison = await client.saison.findFirst({
        where: { tenantId, statut: "OUVERTE" },
    });

    if (!saison) {
        throw new Error("Aucune saison ouverte pour cette Wakala. Contactez un administrateur.");
    }

    return saison;
}
