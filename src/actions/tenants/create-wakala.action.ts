"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

interface CreateWakalaData {
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
}

/**
 * Action pour créer une nouvelle Wakala
 * Crée également un compte administrateur par défaut
 */
export async function createWakalaAction(data: CreateWakalaData) {
    try {
        // Vérifier que le code n'existe pas déjà
        const existing = await prisma.tenant.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            return { error: "Une Wakala avec ce code existe déjà" };
        }

        // Créer la Wakala dans une transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Créer la Wakala
            const wakala = await tx.tenant.create({
                data: {
                    name: data.name,
                    code: data.code,
                    address: data.address,
                    phone: data.phone,
                    email: data.email,
                    active: true,
                },
            });

            // 2. Créer le rôle Admin si pas déjà existant
            let adminRole = await tx.role.findFirst({
                where: { name: "ADMIN" },
            });

            if (!adminRole) {
                adminRole = await tx.role.create({
                    data: {
                        id: createId(),
                        name: "ADMIN",
                        description: "Administrateur système",
                        updatedAt: new Date(),
                    },
                });
            }

            // 3. Créer un compte admin par défaut pour cette Wakala
            const adminEmail = `admin@${data.code.toLowerCase()}.wakala`;
            const defaultPassword = "Admin@123"; // À changer au premier login
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const adminUser = await tx.user.create({
                data: {
                    id: createId(), // Générer un ID unique avec cuid2
                    name: `Admin ${data.name}`,
                    email: adminEmail,
                    password: hashedPassword,
                    active: true,
                },
            });

            // 4. Créer la relation TenantUser
            await tx.tenantUser.create({
                data: {
                    userId: adminUser.id,
                    tenantId: wakala.id,
                    roleId: adminRole.id,
                    active: true,
                },
            });

            return {
                wakala,
                adminUser: {
                    email: adminEmail,
                    password: defaultPassword,
                },
            };
        });

        revalidatePath("/");

        return {
            success: true,
            data: result,
            message: `Wakala créée avec succès! Compte admin: ${result.adminUser.email} / ${result.adminUser.password}`,
        };
    } catch (error) {
        console.error("Error creating wakala:", error);
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Erreur lors de la création de la Wakala",
        };
    }
}
