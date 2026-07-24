import { bonAchatRepository } from "@/repositories/bon-achat.repository";
import { livraisonRepository } from "@/repositories/livraison.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CreateBonAchatInput } from "@/validators/bon-achat.validator";

export const bonAchatService = {
    async getAll(tenantId: string) {
        await requirePermission("bon-achat:read");
        return bonAchatRepository.findAll(tenantId);
    },

    async getById(tenantId: string, id: string) {
        await requirePermission("bon-achat:read");
        const bonAchat = await bonAchatRepository.findById(id, tenantId);
        if (!bonAchat) {
            throw new Error("Bon d'achat introuvable dans cette Wakala");
        }
        return bonAchat;
    },

    /**
     * Crée un bon d'achat standalone pour une livraison existante.
     * Le montant est recalculé côté serveur à partir de la quantité livrée réelle.
     */
    async create(tenantId: string, userId: string, data: CreateBonAchatInput) {
        await requirePermission("bon-achat:create");

        const livraison = await livraisonRepository.findById(data.livraisonId, tenantId);
        if (!livraison) {
            throw new Error("Livraison introuvable dans cette Wakala");
        }

        const existing = await bonAchatRepository.findByLivraisonId(data.livraisonId, tenantId);
        if (existing) {
            throw new Error("Un bon d'achat existe déjà pour cette livraison");
        }

        const montant = data.prixKg * livraison.quantiteLivree;

        return prisma.$transaction(async (tx) => {
            const numero = await bonAchatRepository.generateNumeroBonAchat(tenantId, tx);
            const bonAchat = await bonAchatRepository.create(
                {
                    numero,
                    prixKg: data.prixKg,
                    montant,
                    observations: data.observations,
                    livraisonId: data.livraisonId,
                    createdById: userId,
                    tenantId,
                },
                tx
            );

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_BON_ACHAT",
                    targetId: bonAchat.id,
                    description: `Bon d'achat ${numero} généré pour la livraison ${livraison.numeroLot}`,
                    details: { numero, prixKg: data.prixKg, montant },
                },
                tx
            );

            return bonAchat;
        });
    },
};
