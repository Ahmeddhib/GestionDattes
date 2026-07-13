import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import type { CreatePeseeInput, UpdatePeseeInput } from "@/validators/pesee.validator";

/**
 * Repository pour gérer les pesées
 */
export const peseeRepository = {
    /**
     * Récupérer toutes les pesées d'un tenant
     */
    async findAll(tenantId: string) {
        return prisma.pesee.findMany({
            where: { tenantId },
            include: {
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                        Agriculteur: {
                            select: {
                                id: true,
                                code: true,
                                nom: true,
                                prenom: true,
                            },
                        },
                        TypeDate: {
                            select: {
                                id: true,
                                nom: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * Récupérer une pesée par ID avec vérification du tenant
     */
    async findById(tenantId: string, id: string) {
        return prisma.pesee.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                Livraison: {
                    select: {
                        id: true,
                        numeroLot: true,
                        dateLivraison: true,
                        Agriculteur: {
                            select: {
                                code: true,
                                nom: true,
                                prenom: true,
                            },
                        },
                    },
                },
            },
        });
    },

    /**
     * Récupérer une pesée par livraisonId
     */
    async findByLivraisonId(tenantId: string, livraisonId: string) {
        return prisma.pesee.findFirst({
            where: {
                livraisonId,
                tenantId,
            },
        });
    },

    /**
     * Créer une nouvelle pesée
     */
    async create(tenantId: string, data: CreatePeseeInput) {
        const tare = data.tare ?? 0;
        const poidsNet = data.poidsBrut - tare;

        return prisma.pesee.create({
            data: {
                id: createId(),
                tenantId,
                livraisonId: data.livraisonId,
                poidsBrut: data.poidsBrut,
                tare: tare,
                poidsNet: poidsNet,
                createdAt: new Date(),
            },
        });
    },

    /**
     * Mettre à jour une pesée avec vérification du tenant
     */
    async update(tenantId: string, data: UpdatePeseeInput) {
        // Vérifier que la pesée appartient au tenant
        const existing = await prisma.pesee.findFirst({
            where: {
                id: data.id,
                tenantId,
            },
        });

        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        const tare = data.tare ?? 0;
        const poidsNet = data.poidsBrut - tare;

        return prisma.pesee.update({
            where: { id: data.id },
            data: {
                poidsBrut: data.poidsBrut,
                tare: tare,
                poidsNet: poidsNet,
            },
        });
    },

    /**
     * Supprimer une pesée avec vérification du tenant
     */
    async delete(tenantId: string, id: string) {
        // Vérifier que la pesée appartient au tenant
        const existing = await prisma.pesee.findFirst({
            where: {
                id,
                tenantId,
            },
        });

        if (!existing) {
            throw new Error("Pesée introuvable dans cette Wakala");
        }

        return prisma.pesee.delete({
            where: { id },
        });
    },

    /**
     * Compter le nombre de pesées d'un tenant
     */
    async count(tenantId: string) {
        return prisma.pesee.count({
            where: { tenantId },
        });
    },
};
