import { clientRepository } from "@/repositories/client.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateClientInput, UpdateClientInput } from "@/validators/client.validator";

/**
 * Service pour gérer les clients
 */
export const clientService = {
    /**
     * Récupérer tous les clients
     */
    async getAll(tenantId: string, userId: string) {
        await requirePermission("client:read");
        return clientRepository.findAll(tenantId);
    },

    /**
     * Récupérer un client par ID
     */
    async getById(tenantId: string, userId: string, id: string) {
        await requirePermission("client:read");

        const client = await clientRepository.findById(tenantId, id);
        if (!client) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        return client;
    },

    /**
     * Créer un nouveau client
     */
    async create(tenantId: string, userId: string, data: CreateClientInput) {
        await requirePermission("client:create");

        const client = await clientRepository.create(tenantId, data);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_CLIENT",
            targetId: client.id,
            description: `Client créé: ${client.nom}`,
            details: { nom: client.nom },
        });

        return client;
    },

    /**
     * Mettre à jour un client
     */
    async update(tenantId: string, userId: string, data: UpdateClientInput) {
        await requirePermission("client:update");

        const client = await clientRepository.update(tenantId, data);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_CLIENT",
            targetId: client.id,
            description: `Client mis à jour: ${client.nom}`,
            details: { nom: client.nom },
        });

        return client;
    },

    /**
     * Supprimer un client
     */
    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("client:delete");

        // Vérifier qu'il n'y a pas de ventes associées
        const client = await clientRepository.findById(tenantId, id);
        if (!client) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        if (client._count && client._count.Vente > 0) {
            throw new Error(
                `Impossible de supprimer ce client car il a ${client._count.Vente} vente(s) associée(s)`
            );
        }

        await clientRepository.delete(tenantId, id);

        // Log de l'action
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_CLIENT",
            targetId: id,
            description: `Client supprimé: ${client.nom}`,
            details: { nom: client.nom },
        });

        return { success: true };
    },
};
