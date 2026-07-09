"use server";

import { auth } from "@/lib/auth";
import { verifyUserBelongsToTenant } from "@/lib/tenant/get-tenant";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * Action pour sélectionner une Wakala après login
 * Stocke le tenant pour la ré-authentification
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

        // Stocker les infos pour la ré-authentification
        const cookieStore = await cookies();
        cookieStore.set("selected-tenant-id", tenantId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 5, // 5 minutes
        });

        // Retourner les données pour que le client puisse ré-authentifier
        return {
            success: true,
            email: session.user.email,
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
