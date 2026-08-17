import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";
import type { AuditAction, Prisma } from "@/generated/prisma";

type DbClient = typeof prisma | Prisma.TransactionClient;

/**
 * Repository MULTI-TENANT pour les logs d'audit
 * Toutes les méthodes filtrent automatiquement par tenantId
 */
export const auditRepository = {
    async findAll(
        tenantId: string,
        options?: {
            page?: number;
            pageSize?: number;
            actorId?: string;
            action?: AuditAction;
            targetId?: string;
        }
    ) {
        const page = options?.page || 1;
        const pageSize = Math.min(
            options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        );

        const where: any = {
            tenantId, // FILTRAGE OBLIGATOIRE
        };

        if (options?.actorId) {
            where.actorId = options.actorId;
        }

        if (options?.action) {
            where.action = options.action;
        }

        // Utilisé par l'onglet « Historique » du détail d'une saison : les
        // actions de clôture et de génération de bilan enregistrent l'id de la
        // saison dans `targetId`.
        if (options?.targetId) {
            where.targetId = options.targetId;
        }

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                select: {
                    id: true,
                    action: true,
                    description: true,
                    targetId: true,
                    createdAt: true,
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { data, total, page, pageSize };
    },

    async create(
        data: {
            tenantId: string;
            actorId: string;
            action: AuditAction;
            description?: string;
            targetId?: string;
            details?: any;
        },
        client: DbClient = prisma
    ) {
        const { createId } = await import("@paralleldrive/cuid2");

        return client.auditLog.create({
            data: {
                id: createId(), // ⚠️ Générer l'ID manuellement
                tenantId: data.tenantId,
                actorId: data.actorId,
                action: data.action,
                description: data.description,
                targetId: data.targetId,
                details: data.details,
            },
            select: {
                id: true,
                action: true,
                description: true,
                createdAt: true,
            },
        });
    },

    /**
     * Écrit plusieurs entrées d'audit en une seule instruction.
     *
     * Une entrée par itération de boucle coûtait un aller-retour chacune, ce
     * qui domine le temps d'une création multi-lignes lorsque la base est
     * distante. `createMany` n'a pas de `select`, mais un journal n'a jamais
     * besoin d'être relu juste après avoir été écrit.
     */
    async createMany(
        entrees: {
            tenantId: string;
            actorId: string;
            action: AuditAction;
            description?: string;
            targetId?: string;
            details?: any;
        }[],
        client: DbClient = prisma
    ) {
        if (entrees.length === 0) return { count: 0 };

        const { createId } = await import("@paralleldrive/cuid2");

        return client.auditLog.createMany({
            data: entrees.map((e) => ({
                id: createId(),
                tenantId: e.tenantId,
                actorId: e.actorId,
                action: e.action,
                description: e.description,
                targetId: e.targetId,
                details: e.details,
            })),
        });
    },

    async count(tenantId: string) {
        return prisma.auditLog.count({
            where: { tenantId },
        });
    },
};
