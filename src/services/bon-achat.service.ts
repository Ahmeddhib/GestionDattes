import { bonAchatRepository } from "@/repositories/bon-achat.repository";
import { livraisonRepository } from "@/repositories/livraison.repository";
import { auditService } from "./audit.service";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { assertSaisonOuverte } from "@/lib/saison-guard";
import type { CreateBonAchatInput } from "@/validators/bon-achat.validator";

export const bonAchatService = {
    async getTenantInfo(tenantId: string) {
        const tenant = await prisma.tenant.findUniqueOrThrow({
            where: { id: tenantId },
            select: { name: true, address: true, phone: true, email: true, settings: true },
        });
        const settings = tenant.settings;
        const logoUrl =
            settings && typeof settings === "object" && !Array.isArray(settings) &&
            "logoUrl" in settings && typeof settings.logoUrl === "string" &&
            settings.logoUrl.startsWith("/")
                ? settings.logoUrl
                : "/kayen-logo.jpg";
        return {
            name: tenant.name,
            address: tenant.address,
            phone: tenant.phone,
            email: tenant.email,
            logoUrl,
        };
    },

    async getAll(tenantId: string, opts?: { saisonId?: string }) {
        await requirePermission("bon-achat:read");
        const bonsAchat = await bonAchatRepository.findAll(tenantId, opts);

        // Convertit les Decimal Prisma en number : ces objets ne sont pas
        // sérialisables lorsqu'ils traversent la frontière Server → Client Component.
        return bonsAchat.map((ba) => {
            const montantPaye = ba.PaiementAgriculteur.reduce((sum, p) => sum + p.montant, 0);
            return {
                ...ba,
                montantPaye,
                montantRestant: ba.montant - montantPaye,
                PaiementAgriculteur: undefined,
                Livraison: {
                    ...ba.Livraison,
                    Pesee: ba.Livraison.Pesee.map((p) => ({
                        id: p.id,
                        prixKg: p.prixKg,
                        quantiteAcceptee: p.quantiteAcceptee.toNumber(),
                        poidsNetTotal: p.poidsNetTotal.toNumber(),
                        typeDate: p.TypeDate,
                        typeCaisse: p.TypeCaisse,
                    })),
                },
            };
        });
    },

    async getById(tenantId: string, id: string) {
        await requirePermission("bon-achat:read");
        const bonAchat = await bonAchatRepository.findById(id, tenantId);
        if (!bonAchat) {
            throw new Error("Bon d'achat introuvable dans cette Wakala");
        }
        const montantPaye = bonAchat.PaiementAgriculteur.reduce((sum, p) => sum + p.montant, 0);
        return {
            ...bonAchat,
            montantPaye,
            montantRestant: bonAchat.montant - montantPaye,
            PaiementAgriculteur: undefined,
        };
    },

    /**
     * Crée un bon d'achat standalone pour une livraison existante.
     * Le montant est recalculé côté serveur à partir de la quantité livrée réelle.
     */
    async create(tenantId: string, userId: string, data: CreateBonAchatInput) {
        await requirePermission("bon-achat:create");

        const livraison = await livraisonRepository.findById(data.livraisonId, tenantId);
        if (!livraison) {
            throw new Error("Livraison introuvable dans cette Wakala");
        }

        // Le bon d'achat hérite de la saison de sa livraison — un achat appartient
        // à la campagne où la marchandise est entrée, pas à la saison ouverte du
        // moment. On refuse donc d'en créer un si cette saison-là est clôturée.
        await assertSaisonOuverte(tenantId, livraison.saisonId);

        const existing = await bonAchatRepository.findByLivraisonId(data.livraisonId, tenantId);
        if (existing) {
            throw new Error("Un bon d'achat existe déjà pour cette livraison");
        }

        const montant = data.prixKg * livraison.quantiteLivree;

        return prisma.$transaction(async (tx) => {
            const numero = await bonAchatRepository.generateNumeroBonAchat(tenantId, tx);
            const bonAchat = await bonAchatRepository.create(
                {
                    numero,
                    prixKg: data.prixKg,
                    montant,
                    observations: data.observations,
                    livraisonId: data.livraisonId,
                    saisonId: livraison.saisonId,
                    createdById: userId,
                    tenantId,
                },
                tx
            );

            await auditService.log(
                {
                    tenantId,
                    actorId: userId,
                    action: "CREATE_BON_ACHAT",
                    targetId: bonAchat.id,
                    description: `Bon d'achat ${numero} généré pour la livraison ${livraison.numeroLot}`,
                    details: { numero, prixKg: data.prixKg, montant },
                },
                tx
            );

            return bonAchat;
        });
    },
};
