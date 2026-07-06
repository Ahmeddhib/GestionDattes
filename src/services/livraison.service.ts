import { livraisonRepository } from "@/repositories/livraison.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { typeDateRepository } from "@/repositories/type-date.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import type { CreateLivraisonInput, UpdateLivraisonInput } from "@/validators/livraison.validator";

/**
 * Service métier pour la gestion des livraisons
 */
export const livraisonService = {
    /**
     * Récupère toutes les livraisons avec transformation camelCase
     */
    async getAll(tenantId: string, userId: string) {
        await checkPermission(userId, "livraison:read");

        const livraisons = await livraisonRepository.findAll(tenantId);

        // Transformation PascalCase → camelCase
        return livraisons.map((livraison) => {
            // Calculer la quantité totale en kg
            const quantiteKg = livraison.LivraisonTypeCaisse.reduce((total, ltc) => {
                return total + (ltc.quantite * ltc.TypeCaisse.poidsKg);
            }, 0);

            return {
                ...livraison,
                agriculteur: livraison.Agriculteur,
                typeDate: livraison.TypeDate,
                caisses: livraison.LivraisonTypeCaisse.map((ltc) => ({
                    id: ltc.id,
                    typeCaisseId: ltc.typeCaisseId,
                    quantite: ltc.quantite,
                    typeCaisse: {
                        id: ltc.TypeCaisse.id,
                        nom: ltc.TypeCaisse.nom,
                        poidsKg: ltc.TypeCaisse.poidsKg,
                    },
                })),
                quantiteKg, // Quantité totale calculée
                _count: livraison._count ? {
                    echantillons: livraison._count.Echantillon,
                    pretsCaisses: livraison._count.PretCaisse,
                    stocksDates: livraison._count.StockDate,
                } : undefined,
                // Supprimer les versions PascalCase
                Agriculteur: undefined,
                TypeDate: undefined,
                LivraisonTypeCaisse: undefined,
            };
        });
    },

    /**
     * Récupère une livraison par ID
     */
    async getById(id: string, tenantId: string, userId: string) {
        await checkPermission(userId, "livraison:read");

        const livraison = await livraisonRepository.findById(id, tenantId);
        if (!livraison) {
            throw new Error("Livraison introuvable");
        }

        // Calculer la quantité totale en kg
        const quantiteKg = livraison.LivraisonTypeCaisse.reduce((total, ltc) => {
            return total + (ltc.quantite * ltc.TypeCaisse.poidsKg);
        }, 0);

        // Transformation PascalCase → camelCase
        return {
            ...livraison,
            agriculteur: livraison.Agriculteur ? {
                ...livraison.Agriculteur,
                region: livraison.Agriculteur.Region,
                Region: undefined,
            } : undefined,
            typeDate: livraison.TypeDate,
            caisses: livraison.LivraisonTypeCaisse.map((ltc) => ({
                id: ltc.id,
                typeCaisseId: ltc.typeCaisseId,
                quantite: ltc.quantite,
                typeCaisse: ltc.TypeCaisse,
            })),
            quantiteKg, // Quantité totale calculée
            pesee: livraison.Pesee,
            echantillons: livraison.Echantillon?.map(e => ({
                ...e,
                analyses: e.Analyse,
                Analyse: undefined,
            })),
            pretsCaisses: livraison.PretCaisse,
            stocksDates: livraison.StockDate,
            // Supprimer les versions PascalCase
            Agriculteur: undefined,
            TypeDate: undefined,
            LivraisonTypeCaisse: undefined,
            Pesee: undefined,
            Echantillon: undefined,
            PretCaisse: undefined,
            StockDate: undefined,
        };
    },

    /**
     * Crée une nouvelle livraison
     */
    async create(tenantId: string, userId: string, data: CreateLivraisonInput) {
        await checkPermission(userId, "livraison:create");

        // Vérifier que l'agriculteur existe dans ce tenant
        const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier que le type de datte existe dans ce tenant
        const typeDate = await typeDateRepository.findById(data.typeDateId, tenantId);
        if (!typeDate) {
            throw new Error("Type de datte introuvable");
        }

        // Vérifier que tous les types de caisses existent dans ce tenant
        for (const caisse of data.caisses) {
            const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
            if (!typeCaisse) {
                throw new Error(`Type de caisse introuvable: ${caisse.typeCaisseId}`);
            }
        }

        // Générer le numéro de lot
        const numeroLot = await livraisonRepository.generateNumeroLot(tenantId);

        // Créer la livraison
        const livraison = await livraisonRepository.create(data, tenantId, numeroLot);

        // ===== RETOUR AUTOMATIQUE DES CAISSES =====
        // Pour chaque type de caisse dans la livraison, retourner automatiquement
        // les caisses si l'agriculteur a un prêt en cours
        for (const caisse of data.caisses) {
            try {
                // Trouver les prêts en cours de cet agriculteur pour ce type de caisse
                const pretsEnCours = await pretCaisseRepository.findByAgriculteur(data.agriculteurId, tenantId);
                const pretEnCours = pretsEnCours.find(
                    p => p.typeCaisseId === caisse.typeCaisseId &&
                        p.statut === "EN_COURS" &&
                        (p.nombrePrete - p.nombreRetourne) > 0
                );

                if (pretEnCours) {
                    const nombreRestant = pretEnCours.nombrePrete - pretEnCours.nombreRetourne;
                    // Calculer combien on peut retourner (min entre quantité livrée et quantité restante)
                    const quantiteARetourner = Math.min(caisse.quantite, nombreRestant);

                    if (quantiteARetourner > 0) {
                        // Retourner les caisses
                        await pretCaisseRepository.retournerCaisses(
                            pretEnCours.id,
                            quantiteARetourner,
                            tenantId,
                            `Retour automatique lors de la livraison ${numeroLot}`
                        );

                        // Ajouter le stock au TypeCaisse
                        const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
                        if (typeCaisse) {
                            await typeCaisseRepository.update(tenantId, caisse.typeCaisseId, {
                                stockDisponible: typeCaisse.stockDisponible + quantiteARetourner,
                            });
                        }

                        console.log(`✅ Retour automatique: ${quantiteARetourner} caisses (${typeCaisse?.nom}) retournées pour la livraison ${numeroLot}`);
                    }
                }
            } catch (error) {
                // Ne pas bloquer la création de livraison si le retour automatique échoue
                console.error(`❌ Erreur lors du retour automatique de caisses:`, error);
                console.warn(`⚠️ Erreur lors du retour automatique de caisses:`, error);
            }
        }

        // Calculer la quantité totale pour l'audit log
        const totalQuantityKg = await livraisonRepository.calculateTotalQuantityKg(livraison.id);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_LIVRAISON",
            targetId: livraison.id,
            description: `Livraison créée: ${numeroLot} - ${agriculteur.nom} ${agriculteur.prenom}`,
            details: {
                numeroLot,
                agriculteur: `${agriculteur.nom} ${agriculteur.prenom}`,
                typeDate: typeDate.nom,
                caisses: data.caisses.length,
                totalQuantityKg,
            },
        });

        return livraison;
    },

    /**
     * Met à jour une livraison
     */
    async update(tenantId: string, userId: string, data: UpdateLivraisonInput) {
        await checkPermission(userId, "livraison:update");

        const existing = await livraisonRepository.findById(data.id, tenantId);
        if (!existing) {
            throw new Error("Livraison introuvable");
        }

        // Vérifications des FK si modifiés
        if (data.agriculteurId && data.agriculteurId !== existing.agriculteurId) {
            const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
            if (!agriculteur) {
                throw new Error("Agriculteur introuvable");
            }
        }

        if (data.typeDateId && data.typeDateId !== existing.typeDateId) {
            const typeDate = await typeDateRepository.findById(data.typeDateId, tenantId);
            if (!typeDate) {
                throw new Error("Type de datte introuvable");
            }
        }

        // Vérifier tous les types de caisses si les caisses sont modifiées
        if (data.caisses) {
            for (const caisse of data.caisses) {
                const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
                if (!typeCaisse) {
                    throw new Error(`Type de caisse introuvable: ${caisse.typeCaisseId}`);
                }
            }
        }

        const livraison = await livraisonRepository.update(data.id, data, tenantId);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_LIVRAISON",
            targetId: livraison.id,
            description: `Livraison modifiée: ${existing.numeroLot}`,
            details: {
                numeroLot: existing.numeroLot,
                modifications: data,
            },
        });

        return livraison;
    },

    /**
     * Supprime une livraison
     */
    async delete(tenantId: string, userId: string, id: string) {
        await checkPermission(userId, "livraison:delete");

        const existing = await livraisonRepository.findById(id, tenantId);
        if (!existing) {
            throw new Error("Livraison introuvable");
        }

        // Vérifier si la livraison est utilisée
        const isUsed = await livraisonRepository.isUsed(id, tenantId);
        if (isUsed) {
            throw new Error(
                "Impossible de supprimer cette livraison car elle est utilisée (pesée, échantillons, prêts ou stock)"
            );
        }

        await livraisonRepository.delete(id, tenantId);

        // Audit log
        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_LIVRAISON",
            targetId: id,
            description: `Livraison supprimée: ${existing.numeroLot}`,
            details: {
                numeroLot: existing.numeroLot,
                agriculteur: existing.Agriculteur ? `${existing.Agriculteur.nom} ${existing.Agriculteur.prenom}` : undefined,
            },
        });
    },

    /**
     * Récupère les statistiques des livraisons
     */
    async getStatistics(tenantId: string, userId: string) {
        await checkPermission(userId, "livraison:read");

        return livraisonRepository.getStatistics(tenantId);
    },

    /**
     * Récupère les livraisons d'un agriculteur
     */
    async getByAgriculteur(agriculteurId: string, tenantId: string, userId: string) {
        await checkPermission(userId, "livraison:read");

        const livraisons = await livraisonRepository.findByAgriculteur(agriculteurId, tenantId);

        return livraisons.map((l) => {
            const quantiteKg = l.LivraisonTypeCaisse.reduce((total, ltc) => {
                return total + (ltc.quantite * ltc.TypeCaisse.poidsKg);
            }, 0);

            return {
                ...l,
                typeDate: l.TypeDate,
                caisses: l.LivraisonTypeCaisse.map((ltc) => ({
                    id: ltc.id,
                    typeCaisseId: ltc.typeCaisseId,
                    quantite: ltc.quantite,
                    typeCaisse: ltc.TypeCaisse,
                })),
                quantiteKg,
                TypeDate: undefined,
                LivraisonTypeCaisse: undefined,
            };
        });
    },
};
