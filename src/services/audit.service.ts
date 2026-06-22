import { prisma } from "@/lib/prisma";
import { AuditAction } from "@/generated/prisma";

export async function logAction(
    actorId: string,
    targetId: string | null,
    action: AuditAction,
    description: string
) {
    return prisma.auditLog.create({
        data: {
            actorId,
            targetId,
            action,
            description,
        },
    });
}

export async function getAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
        take: limit,
        orderBy: {
            createdAt: "desc",
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

export async function getAuditLogsByUser(userId: string) {
    return prisma.auditLog.findMany({
        where: {
            OR: [{ actorId: userId }, { targetId: userId }],
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            actor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}
