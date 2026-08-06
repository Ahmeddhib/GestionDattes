import { paiementAgriculteurRepository } from "@/repositories/paiement-agriculteur.repository";
import { bonAchatRepository } from "@/repositories/bon-achat.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreatePaiementAgriculteurInput } from "@/validators/paiement-agriculteur.validator";

export const paiementAgriculteurService = {
    /**
     * Historique des paiements d'un bon d'achat précis.
     */
    async getByBonAchat(tenantId: string, bonAchatId: string) {
        await requirePermission("paiement-agriculteur:read");
        return paiementAgriculteurRepository.findByBonAchat(bonAchatId, tenantId);
    },

    /**
     * Historique complet, pour la page Finance.
     */
    async getAll(tenantId: string) {
        await requirePermission("paiement-agriculteur:read");
        return paiementAgriculteurRepository.findAll(tenantId);
    },

    /**
     * Solde courant d'un bon d'achat (montant / payé / restant / statut),
     * recalculé à la volée — jamais persisté, comme nombreRestant sur PretCaisse.
     */
    async getSoldeBonAchat(tenantId: string, bonAchatId: string) {
        await requirePermission("paiement-agriculteur:read");

        const bonAchat = await bonAchatRepository.findById(bonAchatId, tenantId);
        if (!bonAchat) {
            throw new Error("Bon d'achat introuvable dans cette Wakala");
        }

        const montantPaye = await paiementAgriculteurRepository.getTotalPaidForBonAchat(
            bonAchatId,
            tenantId
        );

        return {
            id: bonAchat.id,
            numero: bonAchat.numero,
            montant: bonAchat.montant,
            montantPaye,
            montantRestant: bonAchat.montant - montantPaye,
            statut: bonAchat.statut,
            agriculteur: bonAchat.Livraison.Agriculteur,
        };
    },

    /**
     * Enregistre un paiement (avance/règlement) sur un bon d'achat et
     * recalcule automatiquement son statut (EN_ATTENTE/PARTIEL/PAYE).
     */
    async enregistrerPaiement(tenantId: string, userId: string, data: CreatePaiementAgriculteurInput) {
        await requirePermission("paiement-agriculteur:create");

        const saison = await getSaisonOuverte(tenantId);

        const result = await prisma.$transaction(async (tx) => {
            return paiementAgriculteurRepository.enregistrer(data, tenantId, userId, saison.id, tx);
        });

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_PAIEMENT_AGRICULTEUR",
            targetId: result.paiement.id,
            description: `Paiement de ${data.montant.toFixed(2)} enregistré sur le bon d'achat ${result.bonAchat.numero}`,
            details: {
                bonAchatId: data.bonAchatId,
                montant: data.montant,
                montantRestant: result.montantRestant,
                statut: result.bonAchat.statut,
            },
        });

        return result;
    },
};
