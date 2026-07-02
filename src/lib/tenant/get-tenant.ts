/**
 * Helpers pour récupérer le tenantId depuis la session
 * RÈGLE CRITIQUE: Le tenantId doit TOUJOURS provenir de la session, jamais du client
 */

import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

/**
 * Récupère le tenantId depuis une session
 * @throws Error si pas de tenantId
 */
export function getTenantFromSession(session: Session | null): string {
    if (!session?.user?.tenantId) {
        throw new Error("Aucun tenant sélectionné. Veuillez sélectionner une Wakala.");
    }
    return session.user.tenantId;
}

/**
 * Récupère le tenantId depuis la session auth() actuelle
 * Utile dans les Server Actions et API Routes
 * @throws Error si pas authentifié ou pas de tenantId
 */
export async function getTenantId(): Promise<string> {
    const session = await auth();
    if (!session?.user) {
        throw new Error("Non authentifié");
    }
    return getTenantFromSession(session);
}

/**
 * Vérifie si un utilisateur appartient à un tenant
 */
export async function verifyUserBelongsToTenant(
    userId: string,
    tenantId: string
): Promise<boolean> {
    const { prisma } = await import("@/lib/prisma");

    const tenantUser = await prisma.tenantUser.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId,
            },
        },
        select: {
            active: true,
        },
    });

    return tenantUser?.active === true;
}

/**
 * Récupère tous les tenants d'un utilisateur
 */
export async function getUserTenants(userId: string) {
    const { prisma } = await import("@/lib/prisma");

    const tenantUsers = await prisma.tenantUser.findMany({
        where: {
            userId,
            active: true,
            Tenant: {
                active: true,
            },
        },
        select: {
            Tenant: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            },
            Role: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            Tenant: {
                name: "asc",
            },
        },
    });

    return tenantUsers.map((tu) => ({
        id: tu.Tenant.id,
        name: tu.Tenant.name,
        code: tu.Tenant.code,
        role: tu.Role,
    }));
}

/**
 * Récupère le rôle d'un utilisateur dans un tenant spécifique
 */
export async function getUserRoleInTenant(userId: string, tenantId: string) {
    const { prisma } = await import("@/lib/prisma");

    const tenantUser = await prisma.tenantUser.findUnique({
        where: {
            userId_tenantId: {
                userId,
                tenantId,
            },
        },
        select: {
            active: true,
            Role: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    });

    if (!tenantUser || !tenantUser.active) {
        return null;
    }

    return tenantUser.Role;
}
