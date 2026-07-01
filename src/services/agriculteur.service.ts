import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { regionRepository } from "@/repositories/region.repository";
import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import type { CreateAgriculteurInput, UpdateAgriculteurInput } from "@/validators/agriculteur.validator";

/**
 * Service de gestion des agriculteurs
 * Logique métier + RBAC + Audit
 */
export const agriculteurService = {
    /**
     * Récupérer tous les agriculteurs
     * Permission: ADMIN, AGENT, DIRECTION, RESPONSABLE_STOCK
     */
    async getAll(userId: string) {
        await requirePermission("agriculteur:read");

        return agriculteurRepository.findAll();
    },

    /**
     * Récupérer un agriculteur par ID
     */
    async getById(userId: string, agriculteurId: string) {
        await requirePermission("agriculteur:read");

        const agriculteur = await agriculteurRepository.findById(agriculteurId);

        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        return agriculteur;
    },

    /**
     * Récupérer les agriculteurs par région
     */
    async getByRegion(userId: string, regionId: string) {
        await requirePermission("agriculteur:read");

        return agriculteurRepository.findByRegion(regionId);
    },

    /**
     * Créer un nouvel agriculteur
     * Permission: ADMIN, AGENT
     */
    async create(userId: string, data: CreateAgriculteurInput) {
        await requirePermission("agriculteur:create");

        // Vérifier que le code n'existe pas déjà
        const codeExists = await agriculteurRepository.findByCode(data.code);
        if (codeExists) {
            throw new Error("Un agriculteur avec ce code existe déjà");
        }

        // Vérifier que le CIN n'existe pas déjà
        const cinExists = await agriculteurRepository.findByCin(data.cin);
        if (cinExists) {
            throw new Error("Un agriculteur avec ce CIN existe déjà");
        }

        // Vérifier que la région existe
        const region = await regionRepository.findById(data.regionId);
        if (!region) {
            throw new Error("Région introuvable");
        }

        const agriculteur = await agriculteurRepository.create({
            code: data.code,
            cin: data.cin,
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            adresse: data.adresse,
            nbPalmiers: data.nbPalmiers,
            superficie: data.superficie,
            productionEstimee: data.productionEstimee,
            region: {
                connect: { id: data.regionId },
            },
        });

        // Audit
        await auditService.log({
            actorId: userId,
            action: "CREATE_AGRICULTEUR",
            targetId: agriculteur.id,
            description: `Agriculteur créé: ${agriculteur.nom} ${agriculteur.prenom}`,
            details: {
                code: agriculteur.code,
                cin: agriculteur.cin,
                nom: agriculteur.nom,
                prenom: agriculteur.prenom,
                regionId: data.regionId,
            },
        });

        return agriculteur;
    },

    /**
     * Mettre à jour un agriculteur
     * Permission: ADMIN, AGENT
     */
    async update(userId: string, data: UpdateAgriculteurInput) {
        await requirePermission("agriculteur:update");

        const existing = await agriculteurRepository.findById(data.id);
        if (!existing) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier que le nouveau code n'existe pas déjà (si fourni et différent)
        if (data.code && data.code !== existing.code) {
            const codeExists = await agriculteurRepository.findByCode(data.code);
            if (codeExists) {
                throw new Error("Un agriculteur avec ce code existe déjà");
            }
        }

        // Vérifier que le nouveau CIN n'existe pas déjà (si fourni et différent)
        if (data.cin && data.cin !== existing.cin) {
            const cinExists = await agriculteurRepository.findByCin(data.cin);
            if (cinExists) {
                throw new Error("Un agriculteur avec ce CIN existe déjà");
            }
        }

        // Vérifier que la nouvelle région existe (si fournie)
        if (data.regionId) {
            const region = await regionRepository.findById(data.regionId);
            if (!region) {
                throw new Error("Région introuvable");
            }
        }

        const updateData: any = {
            code: data.code,
            cin: data.cin,
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            adresse: data.adresse,
            nbPalmiers: data.nbPalmiers,
            superficie: data.superficie,
            productionEstimee: data.productionEstimee,
        };

        if (data.regionId) {
            updateData.region = {
                connect: { id: data.regionId },
            };
        }

        const agriculteur = await agriculteurRepository.update(data.id, updateData);

        // Audit
        await auditService.log({
            actorId: userId,
            action: "UPDATE_AGRICULTEUR",
            targetId: agriculteur.id,
            description: `Agriculteur mis à jour: ${agriculteur.nom} ${agriculteur.prenom}`,
            details: {
                code: agriculteur.code,
                nom: agriculteur.nom,
                prenom: agriculteur.prenom,
            },
        });

        return agriculteur;
    },

    /**
     * Supprimer un agriculteur
     * Permission: ADMIN uniquement
     * Règle métier: Un agriculteur ne peut être supprimé s'il a des livraisons ou des prêts en cours
     */
    async delete(userId: string, agriculteurId: string) {
        await requirePermission("agriculteur:delete");

        const agriculteur = await agriculteurRepository.findById(agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier qu'aucune livraison n'est associée
        const hasLivraisons = await agriculteurRepository.hasLivraisons(agriculteurId);
        if (hasLivraisons) {
            throw new Error("Impossible de supprimer un agriculteur avec des livraisons");
        }

        // Vérifier qu'aucun prêt de caisses n'est en cours
        const hasPretCaisses = await agriculteurRepository.hasPretCaissesEnCours(agriculteurId);
        if (hasPretCaisses) {
            throw new Error("Impossible de supprimer un agriculteur avec des prêts de caisses en cours");
        }

        await agriculteurRepository.delete(agriculteurId);

        // Audit
        await auditService.log({
            actorId: userId,
            action: "DELETE_AGRICULTEUR",
            targetId: agriculteurId,
            description: `Agriculteur supprimé: ${agriculteur.nom} ${agriculteur.prenom}`,
            details: {
                code: agriculteur.code,
                cin: agriculteur.cin,
                nom: agriculteur.nom,
                prenom: agriculteur.prenom,
            },
        });

        return { success: true };
    },
};
