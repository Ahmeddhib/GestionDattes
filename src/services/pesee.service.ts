import { peseeRepository } from "@/repositories/pesee.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreatePeseeInput, UpdatePeseeInput } from "@/validators/pesee.validator";
import { prisma } from "@/lib/prisma";

/**
 * Service pour gérer les pesées
 */
export const peseeService = {
    /**
     * Récupérer toutes les pesées
     */
    async getAll(tenantId: string, userId: string) {
        await requirePermission("pesee:read");
        return peseeRepository.findAll(tenantId);
    },

    /**
     * Récupérer une pesée par ID
     */
    async getById(tenantId: string, userId: string, id: string) {
        await requirePermission("pesee:read");

        const pesee = await peseeRepository.findById(tenantId, id);
        if (!pesee) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return pesee;
    },

    /**
     * Créer une nouvelle pesée
     */
    async create(tenantId: string, userId: string, data: CreatePeseeInput) {
        await requirePermission("pesee:create");

        // Vérifier que la livraison existe et appartient au tenant
        const livraison = await prisma.livraison.findFirst({
            where: {
                id: data.livraisonId,
                tenantId,
            },
        });

        if (!livraison) {
            throw new Error("Livraison introuvable dans cette Wakala");
        }

        // Vérifier qu'il n'y a pas déjà une pesée pour cette livraison
        const existingPesee = await peseeRepository.findByLivraisonId(
            tenantId,
            data.livraisonId
        );

        if (existingPesee) {
            throw new Error("Une pesée existe déjà pour cette livraison");
        }

        const pesee = await peseeRepository.create(tenantId, data);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_PESEE",
            targetId: pesee.id,
            description: `Pesée créée pour la livraison ${livraison.numeroLot}`,
            details: {
                poidsBrut: pesee.poidsBrut,
                poidsNet: pesee.poidsNet,
                tare: pesee.tare,
            },
        });

        return pesee;
    },

    /**
     * Mettre à jour une pesée
     */
    async update(tenantId: string, userId: string, data: UpdatePeseeInput) {
        await requirePermission("pesee:update");

        const pesee = await peseeRepository.update(tenantId, data);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_PESEE",
            targetId: pesee.id,
            description: `Pesée mise à jour`,
            details: {
                poidsBrut: pesee.poidsBrut,
                poidsNet: pesee.poidsNet,
                tare: pesee.tare,
            },
        });

        return pesee;
    },

    /**
     * Supprimer une pesée
     */
    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("pesee:delete");

        const pesee = await peseeRepository.findById(tenantId, id);
        if (!pesee) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        await peseeRepository.delete(tenantId, id);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_PESEE",
            targetId: id,
            description: `Pesée supprimée`,
            details: {
                poidsBrut: pesee.poidsBrut,
                poidsNet: pesee.poidsNet,
            },
        });

        return { success: true };
    },
};
