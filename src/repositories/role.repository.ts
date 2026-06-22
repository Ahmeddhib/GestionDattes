import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

export class RoleRepository {
    async findAll() {
        return prisma.role.findMany({
            orderBy: { name: "asc" },
        });
    }

    async findById(id: string) {
        return prisma.role.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.RoleCreateInput) {
        return prisma.role.create({ data });
    }

    async update(id: string, data: Prisma.RoleUpdateInput) {
        return prisma.role.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return prisma.role.delete({
            where: { id },
        });
    }
}

export const roleRepository = new RoleRepository();
