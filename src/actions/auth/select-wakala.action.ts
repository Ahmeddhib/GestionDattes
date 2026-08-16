"use server";

import { auth, unstable_update } from "@/lib/auth";
import { verifyUserBelongsToTenant } from "@/lib/tenant/get-tenant";
import { prisma } from "@/lib/prisma";

/**
 * Action pour sélectionner une Wakala après login
 * Met à jour la session après vérification des droits côté serveur.
 */
export async function selectWakalaAction(tenantId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id || !session?.user?.email) {
            return { error: "Non authentifié" };
        }

        // Vérifier que l'utilisateur appartient à ce tenant
        const hasAccess = await verifyUserBelongsToTenant(session.user.id, tenantId);

        if (!hasAccess) {
            return { error: "Accès refusé à cette Wakala" };
        }

        // Récupérer les infos du tenant
        const tenantUser = await prisma.tenantUser.findUnique({
            where: {
                userId_tenantId: {
                    userId: session.user.id,
                    tenantId,
                },
            },
            include: {
                Tenant: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        active: true,
                    },
                },
                Role: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!tenantUser || !tenantUser.Tenant.active) {
            return { error: "Wakala inactive" };
        }

        // La callback JWT relit encore ces droits avant de modifier le token.
        await unstable_update({
            user: {
                tenantId: tenantUser.Tenant.id,
                tenantName: tenantUser.Tenant.name,
                tenantCode: tenantUser.Tenant.code,
                role: tenantUser.Role.name,
            },
        });

        return {
            success: true,
            tenant: {
                id: tenantUser.Tenant.id,
                name: tenantUser.Tenant.name,
                code: tenantUser.Tenant.code,
            },
            role: tenantUser.Role.name,
        };
    } catch (error) {
        console.error("Error in selectWakalaAction:", error);
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la sélection de Wakala",
        };
    }
}
