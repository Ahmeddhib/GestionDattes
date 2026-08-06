import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { saisonRepository } from "@/repositories/saison.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { computeIndicateursSaison, type IndicateursSaison } from "./saison-bilan.service";

// Note : la clôture ne crée plus automatiquement la saison suivante. C'est
// à un ADMIN de la créer manuellement (bouton "Nouvelle Saison") une fois
// prêt — il n'y a donc, entre une clôture et cette création manuelle,
// aucune saison OUVERTE pour le tenant (getSaisonOuverte lèvera une erreur
// claire sur toute tentative de création d'opération pendant ce laps de temps).

export interface Blocker {
    code: string;
    message: string;
}

/**
 * Erreur "attendue" : la saison n'est plus OUVERTE (déjà clôturée entre-temps,
 * ex. retour arrière du navigateur, double-clic). Les appelants la distinguent
 * des erreurs techniques pour éviter de la logger comme un crash.
 */
export class SaisonNonOuverteError extends Error {}

export interface AperçuCloture {
    saison: { id: string; nom: string; dateDebut: Date; dateFin: Date; statut: string };
    indicateurs: IndicateursSaison;
    blockers: Blocker[];
}

/**
 * Détermine les conditions bloquantes de la clôture. Le schéma actuel n'a
 * aucune notion de "brouillon" pour Livraison/Vente (une livraison est
 * toujours complète dès sa création via le wizard) — la liste est donc
 * vide pour l'instant, mais reste le point d'extension si une telle
 * condition est ajoutée plus tard.
 */
function computeBlockers(): Blocker[] {
    return [];
}

async function chargerSaisonOuverte(tenantId: string, saisonId: string) {
    const saison = await saisonRepository.findById(tenantId, saisonId);
    if (!saison) {
        throw new Error("Saison introuvable dans cette Wakala");
    }
    if (saison.statut !== "OUVERTE") {
        throw new SaisonNonOuverteError(`La saison "${saison.nom}" est déjà clôturée`);
    }
    return saison;
}

export const saisonClotureService = {
    /**
     * Récupère le bilan figé d'une saison déjà clôturée (lecture pure,
     * jamais recalculé).
     */
    async getBilanSaison(tenantId: string, saisonId: string) {
        await requirePermission("saison:read");
        return prisma.bilanSaison.findFirst({ where: { saisonId, tenantId } });
    },

    async getAperçuCloture(tenantId: string, saisonId: string): Promise<AperçuCloture> {
        await requirePermission("saison:cloturer");

        const saison = await chargerSaisonOuverte(tenantId, saisonId);
        const indicateurs = await computeIndicateursSaison(tenantId, saisonId);
        const blockers = computeBlockers();

        return {
            saison: {
                id: saison.id,
                nom: saison.nom,
                dateDebut: saison.dateDebut,
                dateFin: saison.dateFin,
                statut: saison.statut,
            },
            indicateurs,
            blockers,
        };
    },

    async cloturerSaison(tenantId: string, saisonId: string, userId: string) {
        await requirePermission("saison:cloturer");

        const saison = await chargerSaisonOuverte(tenantId, saisonId);
        const blockers = computeBlockers();
        if (blockers.length > 0) {
            throw new Error(
                `Impossible de clôturer cette saison : ${blockers.map((b) => b.message).join(", ")}`
            );
        }

        const result = await prisma.$transaction(
            async (tx) => {
                const indicateurs = await computeIndicateursSaison(tenantId, saisonId, tx);

                const saisonCloturee = await tx.saison.update({
                    where: { id: saisonId },
                    data: { statut: "CLOTUREE", updatedAt: new Date() },
                });

                const bilan = await tx.bilanSaison.create({
                    data: {
                        id: createId(),
                        saisonId,
                        tenantId,
                        clotureeParId: userId,
                        ...indicateurs,
                        stockFinalParTypeDate: indicateurs.stockFinalParTypeDate as any,
                        stockCaisses: indicateurs.stockCaisses as any,
                    },
                });

                await auditService.log(
                    {
                        tenantId,
                        actorId: userId,
                        action: "CLOTURER_SAISON",
                        targetId: saisonId,
                        description: `Saison clôturée: ${saisonCloturee.nom}`,
                        details: {
                            saisonClotureeId: saisonId,
                            tresorerie: indicateurs.tresorerie,
                            margeBrute: indicateurs.margeBrute,
                            margeNette: indicateurs.margeNette,
                        },
                    },
                    tx
                );

                return { saisonCloturee, bilan };
            },
            { timeout: 20000, maxWait: 10000 }
        );

        return result;
    },
};
