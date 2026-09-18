import { venteRepository } from "@/repositories/vente.repository";
import { clientRepository } from "@/repositories/client.repository";
import { stockDateRepository } from "@/repositories/stock-date.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreateVenteInput, UpdateVenteInput } from "@/validators/vente.validator";
import type { FiltresVente } from "@/repositories/vente.repository";
import type { SortDirection } from "@/lib/pagination";
import { appliquerSortiesCaisses } from "@/services/caisse-stock.service";
import { caisseStockRepository } from "@/repositories/caisse-stock.repository";

async function withSituationsCaisses<
    T extends { clientId: string; montant: number; EncaissementClient: { montant: number }[] }
>(tenantId: string, ventes: T[]) {
    const situations = await caisseStockRepository.getSituationsClients(
        tenantId,
        ventes.map((vente) => vente.clientId)
    );
    return ventes.map((vente) => {
        const montantEncaisse = vente.EncaissementClient.reduce((sum, encaissement) => sum + encaissement.montant, 0);
        return {
            ...vente,
            montantEncaisse,
            montantRestant: vente.montant - montantEncaisse,
            EncaissementClient: undefined,
            SituationCaissesClient: situations.filter((situation) => situation.clientId === vente.clientId),
        };
    });
}

export const venteService = {
    async getAll(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("vente:read");
        const ventes = await venteRepository.findAll(tenantId, opts);
        return withSituationsCaisses(tenantId, ventes);
    },

    /** Toutes les ventes du filtre courant, pour l'export. */
    async getAllFiltre(
        tenantId: string,
        params: { search: string; saisonId?: string; filtres?: FiltresVente }
    ) {
        await requirePermission("vente:read");
        const ventes = await venteRepository.findAllFiltre(tenantId, params);
        return withSituationsCaisses(tenantId, ventes);
    },

    /**
     * Une page de ventes, les totaux du jeu filtré et la liste des clients du
     * filtre — tous trois calculés en base.
     */
    async getPage(
        tenantId: string,
        params: {
            page: number;
            pageSize: number;
            search: string;
            sortBy: string;
            sortDir: SortDirection;
            saisonId?: string;
            filtres?: FiltresVente;
        }
    ) {
        await requirePermission("vente:read");

        const [page, totaux, clients] = await Promise.all([
            venteRepository.findPage(tenantId, params),
            venteRepository.getTotauxFiltres(tenantId, {
                search: params.search,
                saisonId: params.saisonId,
                filtres: params.filtres,
            }),
            // La liste du menu déroulant suit la saison, mais PAS les autres
            // filtres : sinon choisir un client viderait le menu de tous les
            // autres et rendrait le filtre impossible à changer.
            venteRepository.findClientsAvecVente(tenantId, params.saisonId),
        ]);

        return { resultat: { ...page, items: await withSituationsCaisses(tenantId, page.items) }, totaux, clients };
    },

    async getById(tenantId: string, id: string) {
        await requirePermission("vente:read");
        const vente = await venteRepository.findById(id, tenantId);
        if (!vente) {
            throw new Error("Vente introuvable dans cette Wakala");
        }
        return (await withSituationsCaisses(tenantId, [vente]))[0];
    },

    /**
     * Crée une vente et déduit la quantité vendue du lot de stock, dans une
     * transaction — même principe que pretCaisseService.create.
     */
    async create(tenantId: string, userId: string, data: CreateVenteInput) {
        await requirePermission("vente:create");

        const client = await clientRepository.findById(tenantId, data.clientId);
        if (!client) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        const stockDate = await stockDateRepository.findById(tenantId, data.stockId);
        if (!stockDate) {
            throw new Error("Lot de stock introuvable dans cette Wakala");
        }

        if (data.caisses.some((caisse) =>
            caisse.proprietaire === "CLIENT" && caisse.clientProprietaireId !== data.clientId
        )) {
            throw new Error("Les caisses client utilisées doivent appartenir au client de la vente");
        }

        const montant = data.quantite * data.prixUnitaire;
        const saison = await getSaisonOuverte(tenantId);

        const vente = await prisma.$transaction(async (tx) => {
            const nouvelleVente = await venteRepository.create(
                { ...data, montant, saisonId: saison.id },
                tenantId,
                userId,
                tx
            );

            const stockDebit = await tx.stockDate.updateMany({
                where: { id: data.stockId, tenantId, quantiteDisponible: { gte: data.quantite } },
                data: {
                    quantiteDisponible: { decrement: data.quantite },
                    updatedAt: new Date(),
                },
            });

            if (stockDebit.count !== 1) {
                throw new Error("Stock de dattes insuffisant ou lot inaccessible");
            }

            if (data.caisses.length > 0) {
                await tx.venteCaisse.createMany({
                    data: data.caisses.map((caisse) => ({
                        tenantId,
                        venteId: nouvelleVente.id,
                        typeCaisseId: caisse.typeCaisseId,
                        quantite: caisse.quantite,
                        proprietaire: caisse.proprietaire,
                        clientProprietaireId: caisse.clientProprietaireId,
                    })),
                });
                await appliquerSortiesCaisses(tx, {
                    tenantId,
                    userId,
                    sources: data.caisses,
                    type: "SORTIE_VENTE",
                    venteId: nouvelleVente.id,
                    reference: nouvelleVente.id,
                    description: `Caisses utilisées pour la vente à ${client.nom}`,
                });
            }

            await auditService.log({
                tenantId,
                actorId: userId,
                action: "CREATE_VENTE",
                targetId: nouvelleVente.id,
                description: `Vente de ${data.quantite} kg à ${client.nom} pour ${montant.toFixed(2)}`,
                details: {
                    client: client.nom,
                    quantite: data.quantite,
                    prixUnitaire: data.prixUnitaire,
                    montant,
                    caisses: data.caisses,
                },
            }, tx);

            return nouvelleVente;
        }, { timeout: 20_000, maxWait: 10_000 });

        return vente;
    },

    /**
     * Corrige une vente (client/quantité/prix) tant qu'aucun encaissement n'a
     * été enregistré dessus. Le lot de stock n'est pas modifiable ; la
     * quantité réservée sur ce lot est réajustée par delta, dans la même
     * transaction que la mise à jour, pour rester cohérente même en cas de
     * modifications concurrentes. La saison n'est jamais modifiable après
     * création.
     */
    async update(tenantId: string, userId: string, data: UpdateVenteInput) {
        await requirePermission("vente:update");

        const client = await clientRepository.findById(tenantId, data.clientId);
        if (!client) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        const montant = data.quantite * data.prixUnitaire;

        const vente = await prisma.$transaction(async (tx) => {
            const existing = await venteRepository.findEditableById(data.id, tenantId, tx);
            if (!existing) {
                throw new Error("Vente introuvable dans cette Wakala");
            }

            if (existing.statut !== "EN_ATTENTE") {
                throw new Error(
                    "Impossible de modifier une vente qui a déjà un encaissement enregistré"
                );
            }

            if (existing.clientId !== data.clientId && existing.Caisses.some((caisse) => caisse.proprietaire === "CLIENT")) {
                throw new Error("Le client ne peut pas être modifié car la vente utilise ses propres caisses");
            }

            await assertSaisonOuverte(tenantId, existing.saisonId, tx);

            const disponibleAvecAncienneQuantite = existing.StockDate.quantiteDisponible + existing.quantite;
            if (data.quantite > disponibleAvecAncienneQuantite) {
                throw new Error(
                    `Stock insuffisant. Disponible: ${disponibleAvecAncienneQuantite}, Demandé: ${data.quantite}`
                );
            }

            await tx.stockDate.update({
                where: { id: existing.stockId },
                data: {
                    quantiteDisponible: disponibleAvecAncienneQuantite - data.quantite,
                    updatedAt: new Date(),
                },
            });

            return venteRepository.update(data.id, { ...data, montant }, tx);
        });

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "UPDATE_VENTE",
            targetId: vente.id,
            description: `Vente modifiée pour ${client.nom}: ${data.quantite} kg à ${montant.toFixed(2)}`,
            details: {
                client: client.nom,
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant,
            },
        });

        return vente;
    },
};
