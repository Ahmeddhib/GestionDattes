import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API pour créer le tenant par défaut
 * GET /api/setup/default-tenant
 */
export async function GET() {
    try {
        // Vérifier si des tenants existent
        const existingTenants = await prisma.tenant.findMany();

        if (existingTenants.length > 0) {
            return NextResponse.json({
                success: true,
                message: "Des Wakalas existent déjà",
                tenants: existingTenants,
            });
        }

        // Créer le tenant par défaut
        const defaultTenant = await prisma.tenant.create({
            data: {
                id: "default-tenant-id",
                name: "Wakala Principale",
                code: "MAIN",
                active: true,
                address: "Tunis, Tunisie",
                phone: "+216 XX XX XX XX",
                email: "contact@dattes.tn",
            },
        });

        // Créer une relation TenantUser pour l'admin existant si possible
        const adminUser = await prisma.user.findFirst({
            where: {
                email: "admin@dattes.tn",
            },
        });

        if (adminUser) {
            // Trouver le rôle ADMIN
            const adminRole = await prisma.role.findFirst({
                where: {
                    name: "ADMIN",
                },
            });

            if (adminRole) {
                await prisma.tenantUser.create({
                    data: {
                        userId: adminUser.id,
                        tenantId: defaultTenant.id,
                        roleId: adminRole.id,
                        active: true,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Tenant par défaut créé avec succès",
            tenant: defaultTenant,
        });
    } catch (error) {
        console.error("❌ Error creating default tenant:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
