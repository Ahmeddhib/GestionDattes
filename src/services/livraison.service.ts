import { livraisonRepository } from "@/repositories/livraison.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { typeDateRepository } from "@/repositories/type-date.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/constants/roles";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import { supprimerLivraisonEnCascade } from "./livraison-suppression.service";
import { type SortDirection } from "@/lib/pagination";

/**
 * Passage PascalCase (Prisma) → camelCase (UI), partagé par la liste complète
 * et par la version paginée : les deux doivent produire exactement la même
 * forme, sans quoi le tableau se comporterait différemment selon le chemin.
 */
function mapLivraison(
    livraison: Awaited<ReturnType<typeof livraisonRepository.findAll>>[number]
) {
    const quantiteKg =
        livraison.quantiteLivree ??
        livraison.LivraisonTypeCaisse.reduce(
            (total, ltc) => total + ltc.quantite * ltc.TypeCaisse.poidsKg,
            0
        );

    return {
        ...livraison,
        agriculteur: livraison.Agriculteur,
        caisses: livraison.LivraisonTypeCaisse.map((ltc) => ({
            id: ltc.id,
            typeCaisseId: ltc.typeCaisseId,
            typeDateId: ltc.typeDateId,
            quantite: ltc.quantite,
            typeCaisse: {
                id: ltc.TypeCaisse.id,
                nom: ltc.TypeCaisse.nom,
                poidsKg: ltc.TypeCaisse.poidsKg,
            },
            typeDate: ltc.TypeDate,
        })),
        bonAchat: livraison.BonAchat,
        quantiteKg,
        _count: livraison._count
            ? {
                echantillons: livraison._count.Echantillon,
                pretsCaisses: livraison._count.PretCaisse,
                stocksDates: livraison._count.StockDate,
                pesees: livraison._count.Pesee,
            }
            : undefined,
        // On retire les clés PascalCase remplacées ci-dessus.
        Agriculteur: undefined,
        LivraisonTypeCaisse: undefined,
        BonAchat: undefined,
    };
}
import type { CreateLivraisonInput, UpdateLivraisonInput } from "@/validators/livraison.validator";

/**
 * Service métier pour la gestion des livraisons
 */
export const livraisonService = {
    /**
     * Récupère toutes les livraisons avec transformation camelCase
     */
    async getAll(tenantId: string, userId: string, opts?: { saisonId?: string }) {
        await checkPermission(userId, "livraison:read");

        const livraisons = await livraisonRepository.findAll(tenantId, opts);
        return livraisons.map(mapLivraison);
    },

    /**
     * Une page de livraisons, avec les totaux du jeu FILTRÉ à côté.
     *
     * Les totaux viennent d'agrégats en base et non des lignes renvoyées :
     * additionner la page afficherait le total des dix lignes visibles.
     */
    async getPage(
        tenantId: string,
        userId: string,
        params: {
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
        }
    ) {
        await checkPermission(userId, "livraison:read");

        const [page, totaux] = await Promise.all([
            livraisonRepository.findPage(tenantId, params),
            livraisonRepository.getTotauxFiltres(tenantId, {
                search: params.search,
                saisonId: params.saisonId,
            }),
        ]);

        return {
            resultat: { ...page, items: page.items.map(mapLivraison) },
            totaux,
        };
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
        const quantiteKg = livraison.quantiteLivree ?? livraison.LivraisonTypeCaisse.reduce(
            (total, ltc) => total + (ltc.quantite * ltc.TypeCaisse.poidsKg),
            0
        );

        // Transformation PascalCase → camelCase
        return {
            ...livraison,
            agriculteur: livraison.Agriculteur ? {
                ...livraison.Agriculteur,
                region: livraison.Agriculteur.Region,
                Region: undefined,
            } : undefined,
            caisses: livraison.LivraisonTypeCaisse.map((ltc) => ({
                id: ltc.id,
                typeCaisseId: ltc.typeCaisseId,
                typeDateId: ltc.typeDateId,
                quantite: ltc.quantite,
                typeCaisse: ltc.TypeCaisse,
                typeDate: ltc.TypeDate,
            })),
            bonAchat: livraison.BonAchat,
            quantiteKg, // Quantité totale calculée
            pesees: livraison.Pesee.map((p) => ({
                id: p.id,
                typeCaisseId: p.typeCaisseId,
                typeDateId: p.typeDateId,
                tareKg: p.tareKg.toNumber(),
                nombreCaisses: p.nombreCaisses,
                poidsBrutTotal: p.poidsBrutTotal.toNumber(),
                poidsTareTotal: p.poidsTareTotal.toNumber(),
                poidsNetTotal: p.poidsNetTotal.toNumber(),
                poidsBrutMoyen: p.poidsBrutMoyen.toNumber(),
                poidsNetMoyen: p.poidsNetMoyen.toNumber(),
                prixKg: p.prixKg,
                quantiteAcceptee: p.quantiteAcceptee.toNumber(),
                createdAt: p.createdAt,
            })),
            echantillons: livraison.Echantillon?.map(e => ({
                ...e,
                analyses: e.Analyse,
                Analyse: undefined,
            })),
            pretsCaisses: livraison.PretCaisse,
            stocksDates: livraison.StockDate,
            // Supprimer les versions PascalCase
            Agriculteur: undefined,
            LivraisonTypeCaisse: undefined,
            Pesee: undefined,
            Echantillon: undefined,
            PretCaisse: undefined,
            StockDate: undefined,
            BonAchat: undefined,
        };
    },

    /**
     * Crée une nouvelle livraison
     */
    async create(tenantId: string, userId: string, data: CreateLivraisonInput) {
        await checkPermission(userId, "livraison:create");

        const session = await auth();
        const canNegotiate = session?.user.role === ROLES.ADMIN || session?.user.role === ROLES.DIRECTION;
        if (!canNegotiate) {
            data = { ...data, quantiteAcceptee: data.quantiteLivree };
        }

        // Vérifier que l'agriculteur existe dans ce tenant
        const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
        if (!agriculteur) {
            throw new Error("Agriculteur introuvable");
        }

        // Vérifier que chaque type de datte et type de caisse déclarés existent dans ce tenant
        const typeCaisses: Record<string, { poidsKg: number }> = {};
        for (const caisse of data.caisses) {
            const typeDate = await typeDateRepository.findById(caisse.typeDateId, tenantId);
            if (!typeDate) {
                throw new Error(`Type de datte introuvable: ${caisse.typeDateId}`);
            }
            const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
            if (!typeCaisse) {
                throw new Error(`Type de caisse introuvable: ${caisse.typeCaisseId}`);
            }
            typeCaisses[caisse.typeCaisseId] = { poidsKg: typeCaisse.poidsKg };
        }

        // Générer le numéro de lot
        const numeroLot = await livraisonRepository.generateNumeroLot(tenantId);
        const saison = await getSaisonOuverte(tenantId);

        // Une ligne de StockDate par typeDateId distinct, basée sur la quantité déclarée
        // (cette voie standalone n'a pas de pesée réelle en amont, contrairement au wizard).
        const stockGroups = new Map<string, number>();
        for (const caisse of data.caisses) {
            const quantiteKg = caisse.quantite * typeCaisses[caisse.typeCaisseId].poidsKg;
            stockGroups.set(caisse.typeDateId, (stockGroups.get(caisse.typeDateId) ?? 0) + quantiteKg);
        }

        // Créer la livraison
        // Note: le retour automatique des caisses prêtées se fait désormais au moment
        // de la pesée (nombre réel de caisses), pas ici sur la quantité déclarée —
        // voir peseeService.create.
        const livraison = await livraisonRepository.create(
            data,
            tenantId,
            numeroLot,
            Array.from(stockGroups, ([typeDateId, quantite]) => ({ typeDateId, quantite })),
            saison.id
        );

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

        await assertSaisonOuverte(tenantId, existing.saisonId);

        const session = await auth();
        const canNegotiate = session?.user.role === ROLES.ADMIN || session?.user.role === ROLES.DIRECTION;
        const quantiteLivree = data.quantiteLivree ?? existing.quantiteLivree;
        const quantiteAcceptee = canNegotiate
            ? (data.quantiteAcceptee ?? existing.quantiteAcceptee)
            : quantiteLivree;

        if (quantiteAcceptee > quantiteLivree) {
            throw new Error("La quantité acceptée ne peut pas dépasser la quantité livrée");
        }

        data = { ...data, quantiteLivree, quantiteAcceptee };

        // Vérifications des FK si modifiés
        if (data.agriculteurId && data.agriculteurId !== existing.agriculteurId) {
            const agriculteur = await agriculteurRepository.findById(tenantId, data.agriculteurId);
            if (!agriculteur) {
                throw new Error("Agriculteur introuvable");
            }
        }

        // Vérifier tous les types de dattes/caisses si les caisses sont modifiées
        if (data.caisses) {
            for (const caisse of data.caisses) {
                const typeDate = await typeDateRepository.findById(caisse.typeDateId, tenantId);
                if (!typeDate) {
                    throw new Error(`Type de datte introuvable: ${caisse.typeDateId}`);
                }
                const typeCaisse = await typeCaisseRepository.findById(tenantId, caisse.typeCaisseId);
                if (!typeCaisse) {
                    throw new Error(`Type de caisse introuvable: ${caisse.typeCaisseId}`);
                }
            }
        }

        const livraison = await livraisonRepository.update(data.id, data, tenantId);

        const stock = existing.StockDate[0];
        if (stock && quantiteLivree !== existing.quantiteLivree) {
            const difference = quantiteLivree - existing.quantiteLivree;
            await prisma.stockDate.update({
                where: { id: stock.id },
                data: {
                    quantite: quantiteLivree,
                    quantiteDisponible: stock.quantiteDisponible + difference,
                    updatedAt: new Date(),
                },
            });
        }

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

        await assertSaisonOuverte(tenantId, existing.saisonId);

        // Suppression en cascade : la pesée, le stock et le bon d'achat créés
        // par l'assistant sont défaits, et les retours de caisses annulés.
        // Seules les traces laissées en aval (vente, paiement, conditionnement,
        // analyse) bloquent encore — cf. livraison-suppression.service.ts.
        const resultat = await supprimerLivraisonEnCascade(tenantId, id);

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "DELETE_LIVRAISON",
            targetId: id,
            description: `Livraison supprimée: ${existing.numeroLot}`,
            details: {
                numeroLot: existing.numeroLot,
                agriculteur: existing.Agriculteur ? `${existing.Agriculteur.nom} ${existing.Agriculteur.prenom}` : undefined,
                peseesSupprimees: resultat.peseesSupprimees,
                caissesRetireesDuStock: resultat.caissesRetireesDuStock,
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
            const quantiteKg = l.quantiteLivree ?? l.LivraisonTypeCaisse.reduce(
                (total, ltc) => total + (ltc.quantite * ltc.TypeCaisse.poidsKg),
                0
            );

            return {
                ...l,
                caisses: l.LivraisonTypeCaisse.map((ltc) => ({
                    id: ltc.id,
                    typeCaisseId: ltc.typeCaisseId,
                    typeDateId: ltc.typeDateId,
                    quantite: ltc.quantite,
                    typeCaisse: ltc.TypeCaisse,
                    typeDate: ltc.TypeDate,
                })),
                quantiteKg,
                LivraisonTypeCaisse: undefined,
            };
        });
    },
};
