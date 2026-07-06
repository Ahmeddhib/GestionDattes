import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { CreatePretCaisseInput, RetourCaissesInput } from "@/validators/pret-caisse.validator";

/**
 * Service métier pour la gestion des prêts de caisses
 */
export const pretCaisseService = {
    /**
     * Récupère tous les prêts avec transformation camelCase
     */
    async getAll(tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        const prets = await pretCaisseRepository.findAll(tenantId);

        // Transformation PascalCase → camelCase
        return prets.map((pret) => ({
            ...pret,
            agriculteur: pret.Agriculteur,
            typeCaisse: pret.TypeCaisse,
            createdBy: pret.User,
            livraison: pret.Livraison,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            // Supprimer les versions PascalCase
            Agriculteur: undefined,
            TypeCaisse: undefined,
            User: undefined,
            Livraison: undefined,
        }));
    },

    /**
     * Récupère un prêt par ID
     */
    async getById(id: string, tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        const pret = await pretCaisseRepository.findById(id, tenantId);
        if (!pret) {
            throw new Error("Prêt introuvable");
        }

        return {
            ...pret,
            agriculteur: pret.Agriculteur,
            typeCaisse: pret.TypeCaisse,
            createdBy: pret.User,
            livraison: pret.Livraison,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            Agriculteur: undefined,
            TypeCaisse: undefined,
            User: undefined,
            Livraison: undefined,
        };
    },

    /**
     * Récupère les prêts d'un agriculteur
     */
    async getByAgriculteur(agriculteurId: string, tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        const prets = await pretCaisseRepository.findByAgriculteur(agriculteurId, tenantId);

        return prets.map((pret) => ({
            ...pret,
            typeCaisse: pret.TypeCaisse,
            createdBy: pret.User,
            livraison: pret.Livraison,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            TypeCaisse: undefined,
            User: undefined,
            Livraison: undefined,
        }));
    },

    /**
     * Récupère les prêts en cours d'un agriculteur
     */
    async getPretsEnCours(agriculteurId: string, tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        const prets = await pretCaisseRepository.findPretsEnCours(agriculteurId, tenantId);

        return prets.map((pret) => ({
            ...pret,
            typeCaisse: pret.TypeCaisse,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            TypeCaisse: undefined,
        }));
    },

    /**
     * Crée un nouveau prêt de caisses
     */
    async create(tenantId: string, userId: string, data: CreatePretCaisseInput) {
        await checkPermission(userId, "pret-caisse:create");

        // Vérifier que l'agriculteur existe
        const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier que le type de caisse existe
        const typeCaisse = await typeCaisseRepository.findById(tenantId, data.typeCaisseId);
        if (!typeCaisse) {
            throw new Error("Type de caisse introuvable");
        }

        // Vérifier le stock disponible
        if (typeCaisse.stockDisponible < data.nombrePrete) {
            throw new Error(
                `Stock insuffisant. Disponible: ${typeCaisse.stockDisponible}, Demandé: ${data.nombrePrete}`
            );
        }

        // Transaction: créer le prêt ET déduire du stock
        const pret = await prisma.$transaction(async (tx) => {
            // Créer le prêt
            const nouveauPret = await pretCaisseRepository.create(data, tenantId, userId);

            // Déduire du stock
            await tx.typeCaisse.update({
                where: { id: data.typeCaisseId },
                data: {
                    stockDisponible: {
                        decrement: data.nombrePrete,
                    },
                    updatedAt: new Date(),
                },
            });

            return nouveauPret;
        });

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_PRET_CAISSE",
            targetId: pret.id,
            description: `Prêt de ${data.nombrePrete} ${typeCaisse.nom} à ${agriculteur.nom} ${agriculteur.prenom}`,
            details: {
                agriculteur: `${agriculteur.nom} ${agriculteur.prenom}`,
                typeCaisse: typeCaisse.nom,
                nombrePrete: data.nombrePrete,
                stockRestant: typeCaisse.stockDisponible - data.nombrePrete,
            },
        });

        return pret;
    },

    /**
     * Enregistre le retour de caisses
     */
    async retournerCaisses(tenantId: string, userId: string, data: RetourCaissesInput) {
        await checkPermission(userId, "pret-caisse:update");

        // Récupérer le prêt
        const pret = await pretCaisseRepository.findById(data.pretId, tenantId);
        if (!pret) {
            throw new Error("Prêt introuvable");
        }

        // Vérifier que le prêt n'est pas déjà clôturé
        if (pret.statut === "RETOURNE") {
            throw new Error("Ce prêt est déjà clôturé (toutes les caisses ont été retournées)");
        }

        // Vérifier qu'on ne retourne pas plus que restant
        const nombreRestant = pret.nombrePrete - pret.nombreRetourne;
        if (data.nombreRetourne > nombreRestant) {
            throw new Error(
                `Impossible de retourner ${data.nombreRetourne} caisses. Restant: ${nombreRestant}`
            );
        }

        // Transaction: mettre à jour le prêt ET ajouter au stock
        const pretMisAJour = await prisma.$transaction(async (tx) => {
            // Mettre à jour le prêt
            const pretUpdated = await pretCaisseRepository.retournerCaisses(
                data.pretId,
                data.nombreRetourne,
                tenantId,
                data.observations
            );

            // Ajouter au stock
            await tx.typeCaisse.update({
                where: { id: pret.typeCaisseId },
                data: {
                    stockDisponible: {
                        increment: data.nombreRetourne,
                    },
                    updatedAt: new Date(),
                },
            });

            return pretUpdated;
        });

        // Audit log
        const estComplet = pretMisAJour.nombreRetourne === pretMisAJour.nombrePrete;
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "RETOUR_PRET_CAISSE",
            targetId: pret.id,
            description: `Retour de ${data.nombreRetourne} ${pret.TypeCaisse.nom} par ${pret.Agriculteur.nom} ${pret.Agriculteur.prenom}${estComplet ? " (Prêt clôturé)" : ""}`,
            details: {
                agriculteur: `${pret.Agriculteur.nom} ${pret.Agriculteur.prenom}`,
                typeCaisse: pret.TypeCaisse.nom,
                nombreRetourne: data.nombreRetourne,
                nombreRestant: pretMisAJour.nombrePrete - pretMisAJour.nombreRetourne,
                statut: pretMisAJour.statut,
                estComplet,
            },
        });

        return {
            ...pretMisAJour,
            agriculteur: pretMisAJour.Agriculteur,
            typeCaisse: pretMisAJour.TypeCaisse,
            nombreRestant: pretMisAJour.nombrePrete - pretMisAJour.nombreRetourne,
            Agriculteur: undefined,
            TypeCaisse: undefined,
        };
    },

    /**
     * Récupère les statistiques des prêts
     */
    async getStatistiques(tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        return pretCaisseRepository.getStatistiques(tenantId);
    },

    /**
     * Récupère le nombre de caisses restantes pour un agriculteur
     */
    async getNombreCaissesRestantes(agriculteurId: string, tenantId: string, userId: string) {
        await checkPermission(userId, "pret-caisse:read");

        return pretCaisseRepository.getNombreCaissesRestantes(agriculteurId, tenantId);
    },
};
