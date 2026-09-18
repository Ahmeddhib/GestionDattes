import { pretCaisseRepository } from "@/repositories/pret-caisse.repository";
import { typeCaisseRepository } from "@/repositories/type-caisse.repository";
import { agriculteurRepository } from "@/repositories/agriculteur.repository";
import { livreurRepository } from "@/repositories/livreur.repository";
import { auditService } from "./audit.service";
import { checkPermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreatePretCaisseInput, RetourCaissesInput } from "@/validators/pret-caisse.validator";
import type { FiltresPret } from "@/repositories/pret-caisse.repository";
import type { SortDirection } from "@/lib/pagination";
import { appliquerEntreesCaisses, appliquerSortiesCaisses } from "@/services/caisse-stock.service";
import { creerMouvementCaisse, decrementerStockProprietaire } from "@/repositories/caisse-stock.repository";
import type { Prisma } from "@/generated/prisma";

/** Restitue exactement chaque source du prêt et protège contre les doubles retours. */
export async function retournerSourcesPret(
    tx: Prisma.TransactionClient,
    params: {
        tenantId: string;
        userId: string;
        pretId: string;
        quantite: number;
        peseeId?: string;
        reference?: string;
        description?: string;
    }
) {
    const sources = await tx.pretCaisseSource.findMany({
        where: { tenantId: params.tenantId, pretCaisseId: params.pretId },
        orderBy: { createdAt: "asc" },
    });
    let restant = params.quantite;
    const retours: Array<{ proprietaire: "WAKALA" | "CLIENT"; clientProprietaireId?: string; typeCaisseId: string; quantite: number }> = [];

    for (const source of sources) {
        if (restant <= 0) break;
        const disponible = source.quantite - source.quantiteRetournee;
        const quantite = Math.min(disponible, restant);
        if (quantite <= 0) continue;
        const updated = await tx.pretCaisseSource.updateMany({
            where: { id: source.id, tenantId: params.tenantId, quantiteRetournee: source.quantiteRetournee },
            data: { quantiteRetournee: { increment: quantite } },
        });
        if (updated.count !== 1) throw new Error("Le prêt a été modifié simultanément, veuillez réessayer");
        retours.push({
            proprietaire: source.proprietaire,
            clientProprietaireId: source.clientProprietaireId ?? undefined,
            typeCaisseId: source.typeCaisseId,
            quantite,
        });
        restant -= quantite;
    }
    if (restant !== 0) throw new Error("Les sources du prêt ne permettent pas ce retour");

    await appliquerEntreesCaisses(tx, {
        tenantId: params.tenantId,
        userId: params.userId,
        sources: retours,
        type: "RETOUR_AGRICULTEUR",
        pretCaisseId: params.pretId,
        peseeId: params.peseeId,
        reference: params.reference,
        description: params.description,
    });
    return retours;
}

/** Annule exactement les retours générés par une pesée, sans effacer le ledger. */
export async function annulerRetoursPesee(
    tx: Prisma.TransactionClient,
    params: { tenantId: string; userId: string; peseeId: string }
) {
    const mouvements = await tx.mouvementCaisse.findMany({
        where: {
            tenantId: params.tenantId,
            peseeId: params.peseeId,
            type: "RETOUR_AGRICULTEUR",
            direction: "ENTREE",
        },
        orderBy: { createdAt: "desc" },
    });

    for (const mouvement of mouvements) {
        if (!mouvement.pretCaisseId) throw new Error("Mouvement de retour sans prêt associé");
        const source = await tx.pretCaisseSource.findFirst({
            where: {
                tenantId: params.tenantId,
                pretCaisseId: mouvement.pretCaisseId,
                typeCaisseId: mouvement.typeCaisseId,
                proprietaire: mouvement.proprietaire,
                clientProprietaireId: mouvement.clientProprietaireId,
                quantiteRetournee: { gte: mouvement.quantite },
            },
            orderBy: { createdAt: "desc" },
        });
        if (!source) throw new Error("Source du retour automatique introuvable");
        const sourceUpdate = await tx.pretCaisseSource.updateMany({
            where: { id: source.id, tenantId: params.tenantId, quantiteRetournee: source.quantiteRetournee },
            data: { quantiteRetournee: { decrement: mouvement.quantite } },
        });
        if (sourceUpdate.count !== 1) throw new Error("Retour modifié simultanément, veuillez réessayer");
        const pretUpdate = await tx.pretCaisse.updateMany({
            where: { id: mouvement.pretCaisseId, tenantId: params.tenantId, nombreRetourne: { gte: mouvement.quantite } },
            data: {
                nombreRetourne: { decrement: mouvement.quantite },
                statut: "EN_COURS",
                dateRetour: null,
                updatedAt: new Date(),
            },
        });
        if (pretUpdate.count !== 1) throw new Error("Prêt du retour automatique incohérent");

        const stockSource = {
            proprietaire: mouvement.proprietaire,
            clientProprietaireId: mouvement.clientProprietaireId ?? undefined,
            typeCaisseId: mouvement.typeCaisseId,
            quantite: mouvement.quantite,
        };
        await decrementerStockProprietaire(tx, params.tenantId, stockSource);
        await creerMouvementCaisse(tx, {
            tenantId: params.tenantId,
            createdById: params.userId,
            source: stockSource,
            type: "ANNULATION_RETOUR_AGRICULTEUR",
            direction: "SORTIE",
            pretCaisseId: mouvement.pretCaisseId,
            peseeId: params.peseeId,
            reference: mouvement.reference ?? undefined,
            description: "Annulation du retour automatique suite à la suppression de la pesée",
        });
    }
    return mouvements;
}

type PretAvecRelations = Awaited<ReturnType<typeof pretCaisseRepository.findAll>>[number];

/**
 * Transformation PascalCase → camelCase des relations, plus le restant dérivé.
 *
 * Extraite pour que la liste complète, la page et l'export produisent exactement
 * la même forme — sans quoi les colonnes du tableau se videraient selon le
 * chemin de lecture emprunté.
 */
function versCamelCase(pret: PretAvecRelations) {
    return {
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
    };
}

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
        return prets.map(versCamelCase);
    },

    /**
     * Une page de prêts, plus les totaux du jeu filtré et les options des
     * menus de filtre — tous calculés en base.
     *
     * Les statistiques de l'en-tête de page ne viennent PAS d'ici : elles
     * restent un instantané physique global (`getStatistiques`), car des caisses
     * prêtées lors d'une campagne précédente et jamais rendues sont toujours
     * dehors aujourd'hui.
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
            filtres?: FiltresPret;
        }
    ) {
        await checkPermission(userId, "pret-caisse:read");

        const [page, totaux, options] = await Promise.all([
            pretCaisseRepository.findPage(tenantId, params),
            pretCaisseRepository.getTotauxFiltres(tenantId, {
                search: params.search,
                saisonId: params.saisonId,
                filtres: params.filtres,
            }),
            // Les menus suivent la saison mais PAS les autres filtres : sinon
            // choisir un agriculteur viderait le menu de tous les autres et
            // rendrait le filtre impossible à changer.
            pretCaisseRepository.findOptionsFiltres(tenantId, params.saisonId),
        ]);

        return {
            resultat: { ...page, items: page.items.map(versCamelCase) },
            totaux,
            ...options,
        };
    },

    /** Toutes les lignes du filtre courant, pour l'export. */
    async getAllFiltre(
        tenantId: string,
        userId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresPret }
    ) {
        await checkPermission(userId, "pret-caisse:read");
        const prets = await pretCaisseRepository.findAllFiltre(tenantId, params);
        return prets.map(versCamelCase);
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
            sources: pret.Sources
                .map((source) => ({
                    id: source.id,
                    proprietaire: source.proprietaire,
                    clientProprietaire: source.ClientProprietaire,
                    typeCaisse: source.TypeCaisse,
                    quantiteInitiale: source.quantite,
                    quantiteRetournee: source.quantiteRetournee,
                    nombreRestant: source.quantite - source.quantiteRetournee,
                }))
                .filter((source) => source.nombreRestant > 0),
            TypeCaisse: undefined,
            Sources: undefined,
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
        const sources = data.sources.length > 0
            ? data.sources
            : [{ proprietaire: "WAKALA" as const, quantite: data.nombrePrete }];
        if (sources.reduce((total, source) => total + source.quantite, 0) !== data.nombrePrete) {
            throw new Error("La somme des sources doit être égale au nombre de caisses prêtées");
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
                const sourcesAvecType = sources.map((source) => ({
                    ...source,
                    typeCaisseId: data.typeCaisseId,
                }));
                await tx.pretCaisseSource.createMany({
                    data: sourcesAvecType.map((source) => ({
                        tenantId,
                        pretCaisseId: nouveauPret.id,
                        typeCaisseId: data.typeCaisseId,
                        quantite: source.quantite,
                        proprietaire: source.proprietaire,
                        clientProprietaireId: source.clientProprietaireId,
                    })),
                });

                await appliquerSortiesCaisses(tx, {
                    tenantId,
                    userId,
                    sources: sourcesAvecType,
                    type: "PRET_AGRICULTEUR",
                    pretCaisseId: nouveauPret.id,
                    reference: nouveauPret.id,
                    description: `Prêt à ${agriculteur.nom} ${agriculteur.prenom}`,
                });

                await auditService.log({
                    tenantId,
                    actorId: userId,
                    action: "CREATE_PRET_CAISSE",
                    targetId: nouveauPret.id,
                    description: `Prêt de ${data.nombrePrete} ${typeCaisse.nom} à ${agriculteur.nom} ${agriculteur.prenom}`,
                    details: {
                        agriculteur: `${agriculteur.nom} ${agriculteur.prenom}`,
                        typeCaisse: typeCaisse.nom,
                        nombrePrete: data.nombrePrete,
                        sources,
                        livreur: livreur?.nom ?? null,
                    },
                }, tx);

                return nouveauPret;
            },
            // Le délai par défaut de Prisma est de 5 s. Il suffit largement quand
            // l'application et la base sont dans la même région, mais expire dès
            // que la latence est élevée — ce qui faisait échouer la création avec
            // un P2028 alors que rien n'était anormal.
            { timeout: 20000, maxWait: 10000 }
        );

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
                data.observations,
                tx
            );

            await retournerSourcesPret(tx, {
                tenantId,
                userId,
                pretId: pret.id,
                quantite: data.nombreRetourne,
                reference: pret.id,
                description: data.observations || "Retour manuel",
            });

            const estComplet = pretUpdated.nombreRetourne === pretUpdated.nombrePrete;
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
                    nombreRestant: pretUpdated.nombrePrete - pretUpdated.nombreRetourne,
                    statut: pretUpdated.statut,
                    estComplet,
                },
            }, tx);

            return pretUpdated;
        }, { timeout: 20_000, maxWait: 10_000 });

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
