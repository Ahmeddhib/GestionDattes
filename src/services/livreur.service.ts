import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import { livreurRepository } from "@/repositories/livreur.repository";
import type { CreateLivreurInput, UpdateLivreurInput } from "@/validators/livreur.validator";

export const livreurService = {
    async getAll(tenantId: string) {
        await requirePermission("livreur:read");
        return livreurRepository.findAll(tenantId);
    },

    async create(tenantId: string, userId: string, data: CreateLivreurInput) {
        await requirePermission("livreur:create");
        const livreur = await livreurRepository.create(tenantId, data);
        await auditService.log({ tenantId, actorId: userId, action: "CREATE_LIVREUR", targetId: livreur.id, description: `Livreur créé: ${livreur.nom}`, details: { nom: livreur.nom } });
        return livreur;
    },

    async update(tenantId: string, userId: string, data: UpdateLivreurInput) {
        await requirePermission("livreur:update");
        const livreur = await livreurRepository.update(tenantId, data);
        await auditService.log({ tenantId, actorId: userId, action: "UPDATE_LIVREUR", targetId: livreur.id, description: `Livreur mis à jour: ${livreur.nom}`, details: { nom: livreur.nom } });
        return livreur;
    },

    async delete(tenantId: string, userId: string, id: string) {
        await requirePermission("livreur:delete");
        const livreur = await livreurRepository.delete(tenantId, id);
        await auditService.log({ tenantId, actorId: userId, action: "DELETE_LIVREUR", targetId: id, description: `Livreur supprimé: ${livreur.nom}`, details: { nom: livreur.nom } });
    },
};
