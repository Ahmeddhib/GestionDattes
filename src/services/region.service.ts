import { regionRepository } from "@/repositories/region.repository";
import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateRegionInput, UpdateRegionInput } from "@/validators/region.validator";

/**
 * Service de gestion des régions
 * Logique métier + RBAC + Audit
 */
export const regionService = {
    /**
     * Récupérer toutes les régions
     * Permission: Tous les utilisateurs authentifiés peuvent voir les régions
     */
    async getAll(userId: string) {
        await requirePermission("region:read");

        return regionRepository.findAll();
    },

    /**
     * Récupérer une région par ID
     */
    async getById(userId: string, regionId: string) {
        await requirePermission("region:read");

        const region = await regionRepository.findById(regionId);

        if (!region) {
            throw new Error("Région introuvable");
        }

        return region;
    },

    /**
     * Créer une nouvelle région
     * Permission: ADMIN uniquement
     */
    async create(userId: string, data: CreateRegionInput) {
        await requirePermission("region:create");

        // Vérifier que le code n'existe pas déjà (si fourni)
        if (data.code) {
            const existing = await regionRepository.findByCode(data.code);
            if (existing) {
                throw new Error("Une région avec ce code existe déjà");
            }
        }

        const region = await regionRepository.create({
            nom: data.nom,
            code: data.code,
        });

        // Audit
        await auditService.log({
            actorId: userId,
            action: "CREATE_REGION",
            targetId: region.id,
            description: `Région créée: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return region;
    },

    /**
     * Mettre à jour une région
     * Permission: ADMIN uniquement
     */
    async update(userId: string, data: UpdateRegionInput) {
        await requirePermission("region:update");

        const existing = await regionRepository.findById(data.id);
        if (!existing) {
            throw new Error("Région introuvable");
        }

        // Vérifier que le nouveau code n'existe pas déjà (si fourni et différent)
        if (data.code && data.code !== existing.code) {
            const codeExists = await regionRepository.findByCode(data.code);
            if (codeExists) {
                throw new Error("Une région avec ce code existe déjà");
            }
        }

        const region = await regionRepository.update(data.id, {
            nom: data.nom,
            code: data.code,
        });

        // Audit
        await auditService.log({
            actorId: userId,
            action: "UPDATE_REGION",
            targetId: region.id,
            description: `Région mise à jour: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return region;
    },

    /**
     * Supprimer une région
     * Permission: ADMIN uniquement
     * Règle métier: Une région ne peut être supprimée si elle a des agriculteurs ou utilisateurs associés
     */
    async delete(userId: string, regionId: string) {
        await requirePermission("region:delete");

        const region = await regionRepository.findById(regionId);
        if (!region) {
            throw new Error("Région introuvable");
        }

        // Vérifier qu'aucun agriculteur n'est associé
        const hasAgriculteurs = await regionRepository.hasAgriculteurs(regionId);
        if (hasAgriculteurs) {
            throw new Error("Impossible de supprimer une région avec des agriculteurs associés");
        }

        // Vérifier qu'aucun utilisateur n'est associé
        const hasUsers = await regionRepository.hasUsers(regionId);
        if (hasUsers) {
            throw new Error("Impossible de supprimer une région avec des utilisateurs associés");
        }

        await regionRepository.delete(regionId);

        // Audit
        await auditService.log({
            actorId: userId,
            action: "DELETE_REGION",
            targetId: regionId,
            description: `Région supprimée: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return { success: true };
    },
};
