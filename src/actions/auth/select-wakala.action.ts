"use server";

import { auth } from "@/lib/auth";
import { verifyUserBelongsToTenant } from "@/lib/tenant/get-tenant";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Action pour sélectionner une Wakala après login
 * Met à jour la session en récupérant les infos du tenant
 */
export async function selectWakalaAction(tenantId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "Non authentifié" };
        }

        // Vérifier que l'utilisateur appartient à ce tenant
        const hasAccess = await verifyUserBelongsToTenant(session.user.id, tenantId);

        if (!hasAccess) {
            return { error: "Accès refusé à cette Wakala" };
        }

        // Récupérer les infos du tenant et le rôle de l'utilisateur
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
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!tenantUser || !tenantUser.Tenant.active) {
            return { error: "Wakala inactive" };
        }

        // Note: Dans NextAuth v5, on ne peut pas simplement mettre à jour la session
        // L'utilisateur devra se reconnecter avec le tenantId
        // Pour l'instant, on retourne les données et on laisse le client gérer

        // Invalider les caches
        revalidatePath("/dashboard");
        revalidatePath("/select-wakala");

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
