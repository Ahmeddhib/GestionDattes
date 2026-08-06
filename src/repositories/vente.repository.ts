import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createId } from "@paralleldrive/cuid2";

type DbClient = typeof prisma | Prisma.TransactionClient;

export const venteRepository = {
    async findAll(tenantId: string) {
        return prisma.vente.findMany({
            where: { tenantId },
            include: {
                Client: { select: { id: true, nom: true, telephone: true } },
                StockDate: {
                    select: {
                        id: true,
                        TypeDate: { select: { id: true, nom: true } },
                        Livraison: { select: { id: true, numeroLot: true } },
                    },
                },
                User: { select: { id: true, name: true } },
                Saison: { select: { id: true, nom: true } },
                EncaissementClient: { select: { montant: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async findById(id: string, tenantId: string) {
        return prisma.vente.findFirst({
            where: { id, tenantId },
            include: {
                Client: { select: { id: true, nom: true, telephone: true } },
                StockDate: {
                    select: {
                        id: true,
                        TypeDate: { select: { id: true, nom: true } },
                        Livraison: { select: { id: true, numeroLot: true } },
                    },
                },
                User: { select: { id: true, name: true } },
                Saison: { select: { id: true, nom: true } },
                EncaissementClient: { select: { montant: true } },
            },
        });
    },

    async create(
        data: {
            quantite: number;
            prixUnitaire: number;
            montant: number;
            clientId: string;
            stockId: string;
            saisonId: string;
        },
        tenantId: string,
        createdById: string,
        client: DbClient = prisma
    ) {
        return client.vente.create({
            data: {
                id: createId(),
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant: data.montant,
                statut: "EN_ATTENTE",
                Client: { connect: { id: data.clientId } },
                StockDate: { connect: { id: data.stockId } },
                User: { connect: { id: createdById } },
                Tenant: { connect: { id: tenantId } },
                Saison: { connect: { id: data.saisonId } },
            },
        });
    },

    /**
     * Vente non réglée uniquement, avec le lot de stock associé — utilisé
     * pour valider et appliquer une correction de quantité/prix.
     */
    async findEditableById(id: string, tenantId: string, client: DbClient = prisma) {
        return client.vente.findFirst({
            where: { id, tenantId },
            include: { StockDate: true },
        });
    },

    async update(
        id: string,
        data: {
            quantite: number;
            prixUnitaire: number;
            montant: number;
            clientId: string;
        },
        client: DbClient = prisma
    ) {
        return client.vente.update({
            where: { id },
            data: {
                quantite: data.quantite,
                prixUnitaire: data.prixUnitaire,
                montant: data.montant,
                clientId: data.clientId,
            },
        });
    },
};
