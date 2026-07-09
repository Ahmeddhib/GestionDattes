"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";

/**
 * Action pour créer une nouvelle Wakala après login
 * L'utilisateur qui crée la wakala devient automatiquement ADMIN
 */
export async function createWakalaAction(data: { name: string; code: string }) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "Non authentifié" };
        }

        // Validation
        if (!data.name || data.name.trim().length < 3) {
            return { error: "Le nom doit contenir au moins 3 caractères" };
        }

        if (!data.code || data.code.trim().length < 3) {
            return { error: "Le code doit contenir au moins 3 caractères" };
        }

        // Vérifier que le code n'existe pas déjà
        const existingTenant = await prisma.tenant.findUnique({
            where: { code: data.code.trim().toUpperCase() },
        });

        if (existingTenant) {
            return { error: "Ce code de Wakala existe déjà" };
        }

        // Récupérer le rôle ADMIN
        const adminRole = await prisma.role.findFirst({
            where: { name: "ADMIN" },
        });

        if (!adminRole) {
            return { error: "Rôle ADMIN introuvable. Contactez l'administrateur système." };
        }

        // Créer la nouvelle Wakala dans une transaction
        const newTenant = await prisma.$transaction(async (tx) => {
            // 1. Créer le tenant
            const tenant = await tx.tenant.create({
                data: {
                    id: createId(),
                    name: data.name.trim(),
                    code: data.code.trim().toUpperCase(),
                    active: true,
                    settings: {},
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // 2. Associer l'utilisateur au tenant avec le rôle ADMIN
            await tx.tenantUser.create({
                data: {
                    userId: session.user.id,
                    tenantId: tenant.id,
                    roleId: adminRole.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            });

            // 3. Créer un log d'audit
            await tx.auditLog.create({
                data: {
                    id: createId(),
                    actorId: session.user.id,
                    targetId: tenant.id,
                    action: "CREATE_TENANT",
                    description: `Wakala créée: ${tenant.name} (${tenant.code})`,
                    details: {
                        name: tenant.name,
                        code: tenant.code,
                        createdBy: session.user.email,
                    },
                    tenantId: tenant.id,
                    createdAt: new Date(),
                },
            });

            return tenant;
        });

        // Invalider les caches
        revalidatePath("/select-wakala");
        revalidatePath("/dashboard");

        return {
            success: true,
            tenantId: newTenant.id,
            message: "Wakala créée avec succès",
        };
    } catch (error) {
        console.error("❌ Error in createWakalaAction:", error);
        return {
            error: error instanceof Error ? error.message : "Erreur lors de la création de la Wakala",
        };
    }
}
