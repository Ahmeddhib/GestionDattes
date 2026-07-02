import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";
import type { AuditAction } from "@/generated/prisma";

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

    async create(data: {
        tenantId: string;
        actorId: string;
        action: AuditAction;
        description?: string;
        targetId?: string;
        details?: any;
    }) {
        const { createId } = await import("@paralleldrive/cuid2");

        return prisma.auditLog.create({
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

    async count(tenantId: string) {
        return prisma.auditLog.count({
            where: { tenantId },
        });
    },
};
