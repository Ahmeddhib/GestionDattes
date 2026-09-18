import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateTypeCaisseInput, UpdateTypeCaisseInput } from "@/validators/type-caisse.validator";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Service de gestion des types de caisses (MULTI-TENANT)
 * Logique métier + RBAC + Audit
 * Toutes les opérations sont filtrées par tenantId
 */
export const typeCaisseService = {
    /**
     * Récupérer tous les types de caisses (du tenant)
     * Permission: Tous les utilisateurs authentifiés peuvent voir les types de caisses
     */
    async getAll(tenantId: string) {
        await requirePermission("type-caisse:read");

        const typesCaisses = await typeCaisseRepository.findAll(tenantId);

        // Transformer les données pour le format attendu par le composant
        return typesCaisses.map((type) => ({
            ...type,
            _count: {
                livraisons: type._count?.LivraisonTypeCaisse || 0,
                pretsCaisses: type._count?.PretCaisse || 0,
                bonsSortie: type._count?.BonSortie || 0,
                conditionnements: type._count?.Conditionnement || 0,
            },
        }));
    },

    /**
     * Récupérer un type de caisse par ID (avec vérification tenant)
     */
    async getById(tenantId: string, userId: string, typeCaisseId: string) {
        await requirePermission("type-caisse:read");

        const typeCaisse = await typeCaisseRepository.findById(tenantId, typeCaisseId);

        if (!typeCaisse) {
            throw new Error("Type de caisse introuvable");
        }

        return typeCaisse;
    },

    /**
     * Créer un nouveau type de caisse (dans le tenant)
     * Permission: ADMIN, RESPONSABLE_STOCK
     */
    async create(tenantId: string, userId: string, data: CreateTypeCaisseInput) {
        await requirePermission("type-caisse:create");

        // Vérifier que le nom n'existe pas déjà dans ce tenant
        const nomExists = await typeCaisseRepository.findByNom(tenantId, data.nom);
        if (nomExists) {
            throw new Error("Un type de caisse avec ce nom existe déjà dans cette Wakala");
        }

        const typeCaisse = await prisma.$transaction(async (tx) => {
            const cree = await typeCaisseRepository.create(tenantId, {
                nom: data.nom,
                poidsKg: data.poidsKg,
            }, tx);
            await auditService.log({
                tenantId,
                actorId: userId,
                action: "CREATE_TYPE_CAISSE",
                targetId: cree.id,
                description: `Type de caisse créé: ${cree.nom} (${cree.poidsKg} kg)`,
                details: {
                    nom: cree.nom,
                    poidsKg: cree.poidsKg,
                },
            }, tx);
            return cree;
        }, { timeout: 20_000, maxWait: 10_000 });

        return typeCaisse;
    },

    /**
     * Mettre à jour un type de caisse (avec vérification tenant)
     * Permission: ADMIN, RESPONSABLE_STOCK
     */
    async update(tenantId: string, userId: string, data: UpdateTypeCaisseInput) {
        await requirePermission("type-caisse:update");

        const existing = await typeCaisseRepository.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Type de caisse introuvable");
        }

        // Vérifier que le nouveau nom n'existe pas déjà dans ce tenant (si fourni et différent)
        if (data.nom && data.nom !== existing.nom) {
            const nomExists = await typeCaisseRepository.findByNom(tenantId, data.nom);
            if (nomExists) {
                throw new Error("Un type de caisse avec ce nom existe déjà dans cette Wakala");
            }
        }

        const updateData: Prisma.TypeCaisseUpdateInput = {};
        if (data.nom !== undefined) updateData.nom = data.nom;
        if (data.poidsKg !== undefined) updateData.poidsKg = data.poidsKg;

        const typeCaisse = await prisma.$transaction(async (tx) => {
            const misAJour = await typeCaisseRepository.update(tenantId, data.id, updateData, tx);
            await auditService.log({
                tenantId,
                actorId: userId,
                action: "UPDATE_TYPE_CAISSE",
                targetId: misAJour.id,
                description: `Type de caisse mis à jour: ${misAJour.nom}`,
                details: {
                    nom: misAJour.nom,
                    poidsKg: misAJour.poidsKg,
                },
            }, tx);
            return misAJour;
        }, { timeout: 20_000, maxWait: 10_000 });

        return typeCaisse;
    },

    /**
     * Supprimer un type de caisse (avec vérification tenant)
     * Permission: ADMIN uniquement
     * Règle métier: Un type de caisse ne peut être supprimé s'il est utilisé
     */
    async delete(tenantId: string, userId: string, typeCaisseId: string) {
        await requirePermission("type-caisse:delete");

        const typeCaisse = await typeCaisseRepository.findById(tenantId, typeCaisseId);
        if (!typeCaisse) {
            throw new Error("Type de caisse introuvable");
        }

        // Vérifier que le type de caisse n'est pas utilisé
        const isUsed = await typeCaisseRepository.isUsed(tenantId, typeCaisseId);
        if (isUsed) {
            throw new Error("Impossible de supprimer un type de caisse utilisé dans des livraisons, prêts, bons de sortie ou conditionnements");
        }

        await typeCaisseRepository.delete(tenantId, typeCaisseId);

        // Audit
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_TYPE_CAISSE",
            targetId: typeCaisseId,
            description: `Type de caisse supprimé: ${typeCaisse.nom}`,
            details: {
                nom: typeCaisse.nom,
                poidsKg: typeCaisse.poidsKg,
            },
        });

        return { success: true };
    },
};
