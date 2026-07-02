import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";

/**
 * Repository Role (MULTI-TENANT)
 * Note: Les rôles sont globaux mais les assignations se font via TenantUser
 */
export const roleRepository = {
    async findAll(options?: { page?: number; pageSize?: number; search?: string }) {
        const page = options?.page || 1;
        const pageSize = Math.min(
            options?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE,
            PAGINATION.MAX_PAGE_SIZE
        );

        const where = options?.search
            ? {
                OR: [
                    { name: { contains: options.search, mode: "insensitive" as const } },
                    { description: { contains: options.search, mode: "insensitive" as const } },
                ],
            }
            : undefined;

        const [data, total] = await Promise.all([
            prisma.role.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { TenantUser: true }, // Compter via TenantUser
                    },
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            prisma.role.count({ where }),
        ]);

        return { data, total, page, pageSize };
    },

    async findById(id: string) {
        return prisma.role.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { TenantUser: true }, // Compter via TenantUser
                },
            },
        });
    },

    async findByName(name: string) {
        return prisma.role.findUnique({
            where: { name },
            select: {
                id: true,
                name: true,
                description: true,
            },
        });
    },

    async create(data: { name: string; description?: string | null }) {
        return prisma.role.create({
            data,
            select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
            },
        });
    },

    async update(id: string, data: { name?: string; description?: string | null }) {
        return prisma.role.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                description: true,
                updatedAt: true,
            },
        });
    },

    async delete(id: string) {
        return prisma.role.delete({
            where: { id },
            select: { id: true, name: true },
        });
    },

    async count() {
        return prisma.role.count();
    },
};
