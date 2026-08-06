import { saisonRepository } from "@/repositories/saison.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateSaisonInput, UpdateSaisonInput } from "@/validators/saison.validator";

/**
 * Service pour gérer les saisons
 */
export const saisonService = {
    async getAll(tenantId: string) {
        await requirePermission("saison:read");
        return saisonRepository.findAll(tenantId);
    },

    async getOuverte(tenantId: string) {
        await requirePermission("saison:read");
        return saisonRepository.findOuverte(tenantId);
    },

    async getById(tenantId: string, id: string) {
        await requirePermission("saison:read");

        const saison = await saisonRepository.findById(tenantId, id);
        if (!saison) {
            throw new Error("Saison introuvable dans cette Wakala");
        }

        return saison;
    },

    async create(tenantId: string, userId: string, data: CreateSaisonInput) {
        await requirePermission("saison:create");

        if (data.statut === "OUVERTE") {
            const dejaOuverte = await saisonRepository.findOuverte(tenantId);
            if (dejaOuverte) {
                throw new Error(
                    `Impossible de créer une saison OUVERTE : "${dejaOuverte.nom}" est déjà ouverte. Clôturez-la d'abord.`
                );
            }
        }

        const saison = await saisonRepository.create(tenantId, userId, data);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_SAISON",
            targetId: saison.id,
            description: `Saison créée: ${saison.nom}`,
            details: { nom: saison.nom, dateDebut: saison.dateDebut, dateFin: saison.dateFin },
        });

        return saison;
    },

    /**
     * Corrige le nom/les dates d'une saison — le statut ne se change jamais
     * ici (seule la transaction de clôture peut passer une saison à CLOTUREE).
     */
    async update(tenantId: string, userId: string, data: UpdateSaisonInput) {
        await requirePermission("saison:update");

        const saison = await saisonRepository.update(tenantId, data);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_SAISON",
            targetId: saison.id,
            description: `Saison mise à jour: ${saison.nom}`,
            details: { nom: saison.nom, dateDebut: saison.dateDebut, dateFin: saison.dateFin },
        });

        return saison;
    },

    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("saison:delete");

        const saison = await saisonRepository.findById(tenantId, id);
        if (!saison) {
            throw new Error("Saison introuvable dans cette Wakala");
        }

        if (saison._count && saison._count.Vente > 0) {
            throw new Error(
                `Impossible de supprimer cette saison car elle a ${saison._count.Vente} vente(s) associée(s)`
            );
        }

        if (saison.statut === "OUVERTE") {
            throw new Error("Impossible de supprimer la saison ouverte");
        }

        await saisonRepository.delete(tenantId, id);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_SAISON",
            targetId: id,
            description: `Saison supprimée: ${saison.nom}`,
            details: { nom: saison.nom },
        });

        return { success: true };
    },
};
