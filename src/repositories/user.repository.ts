import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export class UserRepository {
    async findAll() {
        return prisma.user.findMany({
            include: { role: true },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({
            data,
            include: { role: true },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }

    async activate(id: string) {
        return prisma.user.update({
            where: { id },
            data: { active: true },
        });
    }

    async deactivate(id: string) {
        return prisma.user.update({
            where: { id },
            data: { active: false },
        });
    }
}

export const userRepository = new UserRepository();
