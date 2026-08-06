import { encaissementClientRepository } from "@/repositories/encaissement-client.repository";
import { venteRepository } from "@/repositories/vente.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreateEncaissementClientInput } from "@/validators/encaissement-client.validator";

export const encaissementClientService = {
    async getByVente(tenantId: string, venteId: string) {
        await requirePermission("encaissement-client:read");
        return encaissementClientRepository.findByVente(venteId, tenantId);
    },

    async getAll(tenantId: string) {
        await requirePermission("encaissement-client:read");
        return encaissementClientRepository.findAll(tenantId);
    },

    /**
     * Solde courant d'une vente (montant / encaissé / restant / statut),
     * recalculé à la volée — jamais persisté.
     */
    async getSoldeVente(tenantId: string, venteId: string) {
        await requirePermission("encaissement-client:read");

        const vente = await venteRepository.findById(venteId, tenantId);
        if (!vente) {
            throw new Error("Vente introuvable dans cette Wakala");
        }

        const montantEncaisse = await encaissementClientRepository.getTotalEncaisseForVente(
            venteId,
            tenantId
        );

        return {
            id: vente.id,
            montant: vente.montant,
            montantEncaisse,
            montantRestant: vente.montant - montantEncaisse,
            statut: vente.statut,
            client: vente.Client,
        };
    },

    /**
     * Enregistre un encaissement (règlement) sur une vente et recalcule
     * automatiquement son statut (EN_ATTENTE/PARTIEL/PAYE).
     */
    async enregistrerEncaissement(
        tenantId: string,
        userId: string,
        data: CreateEncaissementClientInput
    ) {
        await requirePermission("encaissement-client:create");

        const saison = await getSaisonOuverte(tenantId);

        const result = await prisma.$transaction(async (tx) => {
            return encaissementClientRepository.enregistrer(data, tenantId, userId, saison.id, tx);
        });

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_ENCAISSEMENT_CLIENT",
            targetId: result.encaissement.id,
            description: `Encaissement de ${data.montant.toFixed(2)} enregistré sur la vente ${data.venteId}`,
            details: {
                venteId: data.venteId,
                montant: data.montant,
                montantRestant: result.montantRestant,
                statut: result.vente.statut,
            },
        });

        return result;
    },
};
