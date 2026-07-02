import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";

/**
 * Repository User (MULTI-TENANT)
 * Note: Les utilisateurs n'ont plus de rôle global.
 * Les rôles sont gérés par TenantUser (rôle par Wakala).
 */
export const userRepository = {
    async findAll(options?: { page?: number; pageSize?: number; search?: string; active?: boolean }) {
        const page = options?.page || 1;
        const pageSize = Math.min(
            options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        );

        const where: any = {};

        if (options?.search) {
            where.OR = [
                { name: { contains: options.search, mode: "insensitive" as const } },
                { email: { contains: options.search, mode: "insensitive" as const } },
            ];
        }

        if (options?.active !== undefined) {
            where.active = options.active;
        }

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    active: true,
                    createdAt: true,
                    updatedAt: true,
                    // Rôles via TenantUser
                    TenantUser: {
                        select: {
                            Role: {
                                select: {
                                    name: true,
                                },
                            },
                            Tenant: {
                                select: {
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({ where }),
        ]);

        return { data, total, page, pageSize };
    },

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                TenantUser: {
                    select: {
                        Role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                        Tenant: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                        active: true,
                    },
                },
            },
        });
    },

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                active: true,
                TenantUser: {
                    select: {
                        Role: {
                            select: {
                                name: true,
                            },
                        },
                        tenantId: true,
                    },
                },
            },
        });
    },

    async create(data: { id: string; name: string; email: string; password: string }) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                createdAt: true,
            },
        });
    },

    async update(
        id: string,
        data: { name?: string; email?: string; password?: string; active?: boolean }
    ) {
        return prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                updatedAt: true,
            },
        });
    },

    async delete(id: string) {
        return prisma.user.delete({
            where: { id },
            select: { id: true, name: true, email: true },
        });
    },

    async count(options?: { active?: boolean }) {
        return prisma.user.count({
            where: options?.active !== undefined ? { active: options.active } : undefined,
        });
    },
};
