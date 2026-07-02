import { regionRepository } from "@/repositories/region.repository";
import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateRegionInput, UpdateRegionInput } from "@/validators/region.validator";

/**
 * Service de gestion des régions (MULTI-TENANT)
 * Logique métier + RBAC + Audit
 * Toutes les opérations sont filtrées par tenantId
 */
export const regionService = {
    /**
     * Récupérer toutes les régions (du tenant)
     * Permission: Tous les utilisateurs authentifiés peuvent voir les régions
     */
    async getAll(tenantId: string, userId: string) {
        await requirePermission("region:read");

        const regions = await regionRepository.findAll(tenantId);

        // Transformer les données pour le format attendu par le composant
        return regions.map((region: any) => ({
            ...region,
            // Transformer _count.Agriculteur → _count.agriculteurs
            _count: region._count ? {
                agriculteurs: region._count.Agriculteur || 0,
                users: 0, // TODO: Ajouter le compteur des utilisateurs par région si nécessaire
            } : undefined,
        }));
    },

    /**
     * Récupérer une région par ID (avec vérification tenant)
     */
    async getById(tenantId: string, userId: string, regionId: string) {
        await requirePermission("region:read");

        const region = await regionRepository.findById(tenantId, regionId);

        if (!region) {
            throw new Error("Région introuvable");
        }

        return region;
    },

    /**
     * Créer une nouvelle région (dans le tenant)
     * Permission: ADMIN uniquement
     */
    async create(tenantId: string, userId: string, data: CreateRegionInput) {
        await requirePermission("region:create");

        // Vérifier que le code n'existe pas déjà dans ce tenant
        if (data.code) {
            const existing = await regionRepository.findByCode(tenantId, data.code);
            if (existing) {
                throw new Error("Une région avec ce code existe déjà dans cette Wakala");
            }
        }

        const region = await regionRepository.create(tenantId, {
            nom: data.nom,
            code: data.code,
        });

        // Audit
        await auditService.log({
            tenantId, // IMPORTANT: Audit aussi filtré par tenant
            actorId: userId,
            action: "CREATE_REGION",
            targetId: region.id,
            description: `Région créée: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return region;
    },

    /**
     * Mettre à jour une région (avec vérification tenant)
     * Permission: ADMIN uniquement
     */
    async update(tenantId: string, userId: string, data: UpdateRegionInput) {
        await requirePermission("region:update");

        const existing = await regionRepository.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Région introuvable");
        }

        // Vérifier que le nouveau code n'existe pas déjà dans ce tenant
        if (data.code && data.code !== existing.code) {
            const codeExists = await regionRepository.findByCode(tenantId, data.code);
            if (codeExists) {
                throw new Error("Une région avec ce code existe déjà dans cette Wakala");
            }
        }

        const region = await regionRepository.update(tenantId, data.id, {
            nom: data.nom,
            code: data.code,
        });

        // Audit
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_REGION",
            targetId: region.id,
            description: `Région mise à jour: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return region;
    },

    /**
     * Supprimer une région (avec vérification tenant)
     * Permission: ADMIN uniquement
     * Règle métier: Une région ne peut être supprimée si elle a des agriculteurs associés
     */
    async delete(tenantId: string, userId: string, regionId: string) {
        await requirePermission("region:delete");

        const region = await regionRepository.findById(tenantId, regionId);
        if (!region) {
            throw new Error("Région introuvable");
        }

        // Vérifier qu'aucun agriculteur n'est associé (dans ce tenant)
        const hasAgriculteurs = await regionRepository.hasAgriculteurs(tenantId, regionId);
        if (hasAgriculteurs) {
            throw new Error("Impossible de supprimer une région avec des agriculteurs associés");
        }

        await regionRepository.delete(tenantId, regionId);

        // Audit
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_REGION",
            targetId: regionId,
            description: `Région supprimée: ${region.nom}`,
            details: { nom: region.nom, code: region.code },
        });

        return { success: true };
    },
};
