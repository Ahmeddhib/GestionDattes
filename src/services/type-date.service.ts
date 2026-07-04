import { typeDateRepository } from "@/repositories/type-date.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import type { CreateTypeDateInput, UpdateTypeDateInput } from "@/validators/type-date.validator";

/**
 * Service métier pour la gestion des types de dattes
 */
export const typeDateService = {
    /**
     * Récupère tous les types de dattes avec transformation camelCase
     */
    async getAll(tenantId: string, userId: string) {
        await checkPermission(userId, "types_dates:read");

        const typesDates = await typeDateRepository.findAll(tenantId);

        // Transformation PascalCase → camelCase
        return typesDates.map((type) => ({
            ...type,
            _count: type._count ? {
                livraisons: type._count.Livraison,
                stocksDates: type._count.StockDate,
            } : undefined,
        }));
    },

    /**
     * Récupère un type de datte par ID
     */
    async getById(id: string, tenantId: string, userId: string) {
        await checkPermission(userId, "types_dates:read");

        const typeDate = await typeDateRepository.findById(id, tenantId);
        if (!typeDate) {
            throw new Error("Type de datte introuvable");
        }

        // Transformation PascalCase → camelCase
        return {
            ...typeDate,
            _count: typeDate._count ? {
                livraisons: typeDate._count.Livraison,
                stocksDates: typeDate._count.StockDate,
            } : undefined,
        };
    },

    /**
     * Crée un nouveau type de datte
     */
    async create(tenantId: string, userId: string, data: CreateTypeDateInput) {
        await checkPermission(userId, "types_dates:create");

        // Vérifier l'unicité du nom
        const exists = await typeDateRepository.existsByNom(data.nom, tenantId);
        if (exists) {
            throw new Error(`Un type de datte avec le nom "${data.nom}" existe déjà`);
        }

        const typeDate = await typeDateRepository.create(data, tenantId);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_TYPE_DATE",
            targetId: typeDate.id,
            description: `Type de datte créé: ${typeDate.nom}`,
            details: { nom: typeDate.nom, description: typeDate.description },
        });

        return typeDate;
    },

    /**
     * Met à jour un type de datte
     */
    async update(tenantId: string, userId: string, data: UpdateTypeDateInput) {
        await checkPermission(userId, "types_dates:update");

        const existing = await typeDateRepository.findById(data.id, tenantId);
        if (!existing) {
            throw new Error("Type de datte introuvable");
        }

        // Vérifier l'unicité du nom si modifié
        if (data.nom && data.nom !== existing.nom) {
            const exists = await typeDateRepository.existsByNom(data.nom, tenantId, data.id);
            if (exists) {
                throw new Error(`Un type de datte avec le nom "${data.nom}" existe déjà`);
            }
        }

        const typeDate = await typeDateRepository.update(data.id, data, tenantId);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_TYPE_DATE",
            targetId: typeDate.id,
            description: `Type de datte modifié: ${typeDate.nom}`,
            details: {
                ancienNom: existing.nom,
                nouveauNom: typeDate.nom,
            },
        });

        return typeDate;
    },

    /**
     * Supprime un type de datte
     */
    async delete(tenantId: string, userId: string, id: string) {
        await checkPermission(userId, "types_dates:delete");

        const existing = await typeDateRepository.findById(id, tenantId);
        if (!existing) {
            throw new Error("Type de datte introuvable");
        }

        // Vérifier si le type est utilisé
        const isUsed = await typeDateRepository.isUsed(id, tenantId);
        if (isUsed) {
            throw new Error(
                "Impossible de supprimer ce type de datte car il est utilisé dans des livraisons ou du stock"
            );
        }

        await typeDateRepository.delete(id, tenantId);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_TYPE_DATE",
            targetId: id,
            description: `Type de datte supprimé: ${existing.nom}`,
            details: { nom: existing.nom },
        });
    },
};
