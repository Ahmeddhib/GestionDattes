import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";
import type { AuditAction } from "@/generated/prisma";

export const auditRepository = {
    async findAll(options?: {
        page?: number;
        pageSize?: number;
        actorId?: string;
        action?: AuditAction;
    }) {
        const page = options?.page || 1;
        const pageSize = Math.min(
            options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        );

        const where: any = {};

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
                    actor: {
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
        actorId: string;
        action: AuditAction;
        description?: string;
        targetId?: string;
    }) {
        return prisma.auditLog.create({
            data,
            select: {
                id: true,
                action: true,
                description: true,
                createdAt: true,
            },
        });
    },

    async count() {
        return prisma.auditLog.count();
    },
};
