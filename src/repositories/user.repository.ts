import { prisma } from "@/lib/prisma";
import { PAGINATION } from "@/constants/pagination";

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
                    role: {
                        select: {
                            id: true,
                            name: true,
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
                roleId: true,
                createdAt: true,
                updatedAt: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
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
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    },

    async create(data: { name: string; email: string; password: string; roleId: string }) {
        return prisma.user.create({
            data,
            select: {
                id: true,
                name: true,
                email: true,
                active: true,
                createdAt: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    },

    async update(
        id: string,
        data: { name?: string; email?: string; password?: string; roleId?: string; active?: boolean }
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
                role: {
                    select: {
                        name: true,
                    },
                },
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
