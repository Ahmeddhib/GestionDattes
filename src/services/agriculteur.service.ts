import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { regionRepository } from "@/repositories/region.repository";
import { auditService } from "@/services/audit.service";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CreateAgriculteurInput, UpdateAgriculteurInput } from "@/validators/agriculteur.validator";

/**
 * Service de gestion des agriculteurs (MULTI-TENANT)
 * Logique métier + RBAC + Audit
 * Toutes les opérations sont filtrées par tenantId
 */
export const agriculteurService = {
    /**
     * Récupérer tous les agriculteurs (du tenant)
     * Permission: Tous les utilisateurs authentifiés peuvent voir les agriculteurs
     */
    async getAll(tenantId: string, userId: string) {
        await requirePermission("agriculteur:read");
        const agriculteurs = await agriculteurRepository.findAll(tenantId);

        // Transformer les données pour le format attendu par le composant
        return agriculteurs.map((agriculteur: any) => ({
            ...agriculteur,
            // Transformer Region → region (si présent)
            region: agriculteur.Region ? {
                id: agriculteur.Region.id,
                nom: agriculteur.Region.nom,
                code: agriculteur.Region.code,
            } : null,
            // Supprimer Region avec majuscule pour éviter la confusion
            Region: undefined,
        }));
    },

    /**
     * Récupérer un agriculteur par ID (avec vérification tenant)
     */
    async getById(tenantId: string, userId: string, agriculteurId: string) {
        await requirePermission("agriculteur:read");

        const agriculteur = await agriculteurRepository.findById(tenantId, agriculteurId);

        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Transformer Region → region
        return {
            ...agriculteur,
            region: agriculteur.Region ? {
                id: agriculteur.Region.id,
                nom: agriculteur.Region.nom,
                code: agriculteur.Region.code,
            } : null,
            Region: undefined,
        };
    },

    /**
     * Récupérer les agriculteurs par région (dans le tenant)
     */
    async getByRegion(tenantId: string, userId: string, regionId: string) {
        await requirePermission("agriculteur:read");

        const agriculteurs = await agriculteurRepository.findByRegion(tenantId, regionId);

        // Transformer Region → region
        return agriculteurs.map((agriculteur: any) => ({
            ...agriculteur,
            region: agriculteur.Region ? {
                id: agriculteur.Region.id,
                nom: agriculteur.Region.nom,
                code: agriculteur.Region.code,
            } : null,
            Region: undefined,
        }));
    },

    /**
     * Générer un code unique pour un agriculteur
     * Format: AGR-XXXX (où XXXX est un numéro séquentiel)
     */
    async generateUniqueCode(tenantId: string): Promise<string> {
        const prefix = "AGR";
        let counter = 1;
        let code = "";
        let exists = true;

        // Récupérer le dernier code pour ce tenant
        const lastAgriculteur = await prisma.agriculteur.findFirst({
            where: { tenantId },
            orderBy: { code: "desc" },
            select: { code: true },
        });

        if (lastAgriculteur && lastAgriculteur.code.startsWith(prefix)) {
            // Extraire le numéro du dernier code (ex: AGR-0045 -> 45)
            const lastNumber = parseInt(lastAgriculteur.code.substring(prefix.length + 1));
            if (!isNaN(lastNumber)) {
                counter = lastNumber + 1;
            }
        }

        // Chercher un code disponible
        while (exists) {
            code = `${prefix}-${counter.toString().padStart(4, "0")}`;
            exists = await agriculteurRepository.findByCode(tenantId, code) !== null;
            if (exists) counter++;
        }

        return code;
    },

    /**
     * Créer un nouvel agriculteur (dans le tenant)
     * Permission: ADMIN, AGENT
     */
    async create(tenantId: string, userId: string, data: CreateAgriculteurInput) {
        await requirePermission("agriculteur:create");

        // Générer automatiquement le code si non fourni
        const code = data.code || (await this.generateUniqueCode(tenantId));

        // Vérifier que le code n'existe pas déjà dans ce tenant
        const codeExists = await agriculteurRepository.findByCode(tenantId, code);
        if (codeExists) {
            throw new Error("Un agriculteur avec ce code existe déjà dans cette Wakala");
        }

        // Vérifier que le CIN n'existe pas déjà dans ce tenant
        const cinExists = await agriculteurRepository.findByCin(tenantId, data.cin);
        if (cinExists) {
            throw new Error("Un agriculteur avec ce CIN existe déjà dans cette Wakala");
        }

        // Vérifier que la région existe dans ce tenant
        const region = await regionRepository.findById(tenantId, data.regionId);
        if (!region) {
            throw new Error("Région introuvable");
        }

        const agriculteur = await agriculteurRepository.create(tenantId, {
            code: code,
            cin: data.cin,
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone,
            adresse: data.adresse,
            nbPalmiers: data.nbPalmiers,
            superficie: data.superficie,
            productionEstimee: data.productionEstimee,
            Region: {
                connect: { id: data.regionId },
            },
        });

        // Audit
        await auditService.log({
            tenantId, // IMPORTANT: Audit aussi filtré par tenant
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
     * Mettre à jour un agriculteur (avec vérification tenant)
     * Permission: ADMIN, AGENT
     */
    async update(tenantId: string, userId: string, data: UpdateAgriculteurInput) {
        await requirePermission("agriculteur:update");

        const existing = await agriculteurRepository.findById(tenantId, data.id);
        if (!existing) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier que le nouveau code n'existe pas déjà dans ce tenant (si fourni et différent)
        if (data.code && data.code !== existing.code) {
            const codeExists = await agriculteurRepository.findByCode(tenantId, data.code);
            if (codeExists) {
                throw new Error("Un agriculteur avec ce code existe déjà dans cette Wakala");
            }
        }

        // Vérifier que le nouveau CIN n'existe pas déjà dans ce tenant (si fourni et différent)
        if (data.cin && data.cin !== existing.cin) {
            const cinExists = await agriculteurRepository.findByCin(tenantId, data.cin);
            if (cinExists) {
                throw new Error("Un agriculteur avec ce CIN existe déjà dans cette Wakala");
            }
        }

        // Vérifier que la nouvelle région existe dans ce tenant (si fournie)
        if (data.regionId) {
            const region = await regionRepository.findById(tenantId, data.regionId);
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
            updateData.Region = {
                connect: { id: data.regionId },
            };
        }

        const agriculteur = await agriculteurRepository.update(tenantId, data.id, updateData);

        // Audit
        await auditService.log({
            tenantId,
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
     * Supprimer un agriculteur (avec vérification tenant)
     * Permission: ADMIN uniquement
     * Règle métier: Un agriculteur ne peut être supprimé s'il a des livraisons ou des prêts en cours
     */
    async delete(tenantId: string, userId: string, agriculteurId: string) {
        await requirePermission("agriculteur:delete");

        const agriculteur = await agriculteurRepository.findById(tenantId, agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier qu'aucune livraison n'est associée (dans ce tenant)
        const hasLivraisons = await agriculteurRepository.hasLivraisons(tenantId, agriculteurId);
        if (hasLivraisons) {
            throw new Error("Impossible de supprimer un agriculteur avec des livraisons");
        }

        // Vérifier qu'aucun prêt de caisses n'est en cours (dans ce tenant)
        const hasPretCaisses = await agriculteurRepository.hasPretCaissesEnCours(tenantId, agriculteurId);
        if (hasPretCaisses) {
            throw new Error("Impossible de supprimer un agriculteur avec des prêts de caisses en cours");
        }

        await agriculteurRepository.delete(tenantId, agriculteurId);

        // Audit
        await auditService.log({
            tenantId,
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
