import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { livreurRepository } from "@/repositories/livreur.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreatePretCaisseInput, RetourCaissesInput } from "@/validators/pret-caisse.validator";

/**
 * Service métier pour la gestion des prêts de caisses
 */
export const pretCaisseService = {
    /**
     * Récupère tous les prêts avec transformation camelCase
     */
    async getAll(tenantId: string, userId: string, opts?: { saisonId?: string }) {
        await checkPermission(userId, "pret-caisse:read");

        const prets = await pretCaisseRepository.findAll(tenantId, opts);

        // Transformation PascalCase → camelCase
        return prets.map((pret) => ({
            ...pret,
            agriculteur: pret.Agriculteur,
            typeCaisse: pret.TypeCaisse,
            createdBy: pret.User,
            livraison: pret.Livraison,
            livreur: pret.Livreur,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            // Supprimer les versions PascalCase
            Agriculteur: undefined,
            TypeCaisse: undefined,
            User: undefined,
            Livraison: undefined,
            Livreur: undefined,
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
            livreur: pret.Livreur,
            nombreRestant: pret.nombrePrete - pret.nombreRetourne,
            Agriculteur: undefined,
            TypeCaisse: undefined,
            User: undefined,
            Livraison: undefined,
            Livreur: undefined,
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

        // Un prêt est un événement physique daté : il est rattaché à la saison
        // ouverte au moment où il est consenti (livraisonId étant optionnel,
        // il n'existe aucun autre rattachement possible).
        const saison = await getSaisonOuverte(tenantId);

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

        // Vérifier que le livreur (facultatif) appartient bien au tenant
        let livreur = null;
        if (data.livreurId) {
            livreur = await livreurRepository.findById(tenantId, data.livreurId);
            if (!livreur) {
                throw new Error("Livreur introuvable dans cette Wakala");
            }
        }

        // Transaction: créer le prêt ET déduire du stock
        const pret = await prisma.$transaction(
            async (tx) => {
                const nouveauPret = await pretCaisseRepository.create(
                    data,
                    tenantId,
                    userId,
                    saison.id,
                    tx
                );

                // `updateMany` filtré par tenant : `update` sur l'id seul
                // laissait la porte ouverte à un décrément sur le type de caisse
                // d'une autre Wakala si l'id venait à ne pas correspondre.
                await tx.typeCaisse.updateMany({
                    where: { id: data.typeCaisseId, tenantId },
                    data: {
                        stockDisponible: { decrement: data.nombrePrete },
                        updatedAt: new Date(),
                    },
                });

                return nouveauPret;
            },
            // Le délai par défaut de Prisma est de 5 s. Il suffit largement quand
            // l'application et la base sont dans la même région, mais expire dès
            // que la latence est élevée — ce qui faisait échouer la création avec
            // un P2028 alors que rien n'était anormal.
            { timeout: 20000, maxWait: 10000 }
        );

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
                livreur: livreur?.nom ?? null,
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

        // Un retour modifie un prêt existant : il est refusé si la saison de ce
        // prêt est clôturée.
        await assertSaisonOuverte(tenantId, pret.saisonId);

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
