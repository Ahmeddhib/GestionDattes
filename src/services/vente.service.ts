import { venteRepository } from "@/repositories/vente.repository";
import { clientRepository } from "@/repositories/client.repository";
import { stockDateRepository } from "@/repositories/stock-date.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { assertSaisonOuverte, getSaisonOuverte } from "@/lib/saison-guard";
import { prisma } from "@/lib/prisma";
import type { CreateVenteInput, UpdateVenteInput } from "@/validators/vente.validator";

function withSolde<T extends { montant: number; EncaissementClient: { montant: number }[] }>(vente: T) {
    const montantEncaisse = vente.EncaissementClient.reduce((sum, e) => sum + e.montant, 0);
    return {
        ...vente,
        montantEncaisse,
        montantRestant: vente.montant - montantEncaisse,
        EncaissementClient: undefined,
    };
}

export const venteService = {
    async getAll(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("vente:read");
        const ventes = await venteRepository.findAll(tenantId, opts);
        return ventes.map(withSolde);
    },

    async getById(tenantId: string, id: string) {
        await requirePermission("vente:read");
        const vente = await venteRepository.findById(id, tenantId);
        if (!vente) {
            throw new Error("Vente introuvable dans cette Wakala");
        }
        return withSolde(vente);
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

        if (stockDate.quantiteDisponible < data.quantite) {
            throw new Error(
                `Stock insuffisant. Disponible: ${stockDate.quantiteDisponible}, Demandé: ${data.quantite}`
            );
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

            await tx.stockDate.update({
                where: { id: data.stockId },
                data: {
                    quantiteDisponible: { decrement: data.quantite },
                    updatedAt: new Date(),
                },
            });

            return nouvelleVente;
        });

        await auditService.log({
            tenantId,
            actorId: userId,
            action: "CREATE_VENTE",
            targetId: vente.id,
            description: `Vente de ${data.quantite} kg à ${client.nom} pour ${montant.toFixed(2)}`,
            details: {
                client: client.nom,
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant,
            },
        });

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
