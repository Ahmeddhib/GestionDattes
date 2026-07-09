import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { CreateClientInput, UpdateClientInput } from "@/validators/client.validator";

/**
 * Repository pour gérer les clients
 */
export const clientRepository = {
    /**
     * Récupérer tous les clients d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.client.findMany({
            where: { tenantId },
            orderBy: { nom: "asc" },
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
     * Récupérer un client par ID avec vérification du tenant
     */
    async findById(tenantId: string, id: string) {
        return prisma.client.findFirst({
            where: {
                id,
                tenantId,
            },
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
     * Créer un nouveau client
     */
    async create(tenantId: string, data: CreateClientInput) {
        return prisma.client.create({
            data: {
                id: createId(),
                tenantId,
                nom: data.nom,
                telephone: data.telephone || null,
                adresse: data.adresse || null,
                email: data.email || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Mettre à jour un client avec vérification du tenant
     */
    async update(tenantId: string, data: UpdateClientInput) {
        // Vérifier que le client appartient au tenant
        const existing = await prisma.client.findFirst({
            where: {
                id: data.id,
                tenantId,
            },
        });

        if (!existing) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        return prisma.client.update({
            where: { id: data.id },
            data: {
                nom: data.nom,
                telephone: data.telephone || null,
                adresse: data.adresse || null,
                email: data.email || null,
                updatedAt: new Date(),
            },
        });
    },

    /**
     * Supprimer un client avec vérification du tenant
     */
    async delete(tenantId: string, id: string) {
        // Vérifier que le client appartient au tenant
        const existing = await prisma.client.findFirst({
            where: {
                id,
                tenantId,
            },
        });

        if (!existing) {
            throw new Error("Client introuvable dans cette Wakala");
        }

        return prisma.client.delete({
            where: { id },
        });
    },

    /**
     * Compter le nombre de clients d'un tenant
     */
    async count(tenantId: string) {
        return prisma.client.count({
            where: { tenantId },
        });
    },
};
