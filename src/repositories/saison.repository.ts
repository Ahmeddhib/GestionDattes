import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@/generated/prisma";
import type { CreateSaisonInput, UpdateSaisonInput } from "@/validators/saison.validator";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Repository pour gérer les saisons
 */
export const saisonRepository = {
    /**
     * Récupérer toutes les saisons d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.saison.findMany({
            where: { tenantId },
            orderBy: { dateDebut: "desc" },
            include: {
                _count: {
                    select: {
                        Vente: true,
                    },
                },
            },
        });
    },

    /**
     * Récupérer la saison OUVERTE du tenant (il y en a au plus une)
     */
    async findOuverte(tenantId: string) {
        return prisma.saison.findFirst({
            where: { tenantId, statut: "OUVERTE" },
        });
    },

    /**
     * Récupérer une saison par ID avec vérification du tenant
     */
    async findById(tenantId: string, id: string) {
        return prisma.saison.findFirst({
            where: { id, tenantId },
            include: {
                _count: {
                    select: {
                        Vente: true,
                    },
                },
            },
        });
    },

    /**
     * Créer une nouvelle saison
     */
    async create(tenantId: string, createdById: string, data: CreateSaisonInput, client: DbClient = prisma) {
        return client.saison.create({
            data: {
                id: createId(),
                tenantId,
                createdById,
                nom: data.nom,
                dateDebut: data.dateDebut,
                dateFin: data.dateFin,
                statut: data.statut ?? "OUVERTE",
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Mettre à jour une saison avec vérification du tenant (nom/dates
     * uniquement — le statut n'est jamais modifié depuis ce chemin)
     */
    async update(tenantId: string, data: UpdateSaisonInput) {
        const existing = await prisma.saison.findFirst({
            where: { id: data.id, tenantId },
        });

        if (!existing) {
            throw new Error("Saison introuvable dans cette Wakala");
        }

        return prisma.saison.update({
            where: { id: data.id },
            data: {
                nom: data.nom,
                dateDebut: data.dateDebut,
                dateFin: data.dateFin,
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Supprimer une saison avec vérification du tenant
     */
    async delete(tenantId: string, id: string) {
        const existing = await prisma.saison.findFirst({
            where: { id, tenantId },
        });

        if (!existing) {
            throw new Error("Saison introuvable dans cette Wakala");
        }

        return prisma.saison.delete({
            where: { id },
        });
    },
};
