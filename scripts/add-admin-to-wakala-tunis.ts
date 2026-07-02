import { prisma } from "../src/lib/prisma";
import { createId } from "@paralleldrive/cuid2";

async function addAdminToWakalaTunis() {
    console.log("🔧 Adding admin to wakala tunis...\n");

    // Trouver l'utilisateur admin
    const admin = await prisma.user.findUnique({
        where: { email: "admin@dattes.tn" },
    });

    if (!admin) {
        console.log("❌ Admin user not found!");
        return;
    }

    // Trouver wakala tunis
    const wakalaTunis = await prisma.tenant.findFirst({
        where: { code: "TUN-NORD" },
    });

    if (!wakalaTunis) {
        console.log("❌ Wakala Tunis not found!");
        return;
    }

    // Trouver le rôle ADMIN
    const adminRole = await prisma.role.findFirst({
        where: { name: "ADMIN" },
    });

    if (!adminRole) {
        console.log("❌ ADMIN role not found!");
        return;
    }

    // Vérifier si déjà ajouté
    const existing = await prisma.tenantUser.findUnique({
        where: {
            userId_tenantId: {
                userId: admin.id,
                tenantId: wakalaTunis.id,
            },
        },
    });

    if (existing) {
        console.log("✅ Admin already has access to wakala tunis");
        console.log(`   User: ${admin.email}`);
        console.log(`   Tenant: ${wakalaTunis.name} (${wakalaTunis.code})`);
        console.log(`   Role: ADMIN`);
        return;
    }

    // Ajouter l'admin à wakala tunis
    await prisma.tenantUser.create({
        data: {
            id: createId(),
            userId: admin.id,
            tenantId: wakalaTunis.id,
            roleId: adminRole.id,
            active: true,
        },
    });

    console.log("✅ Admin added to wakala tunis successfully!");
    console.log(`   User: ${admin.email}`);
    console.log(`   Tenant: ${wakalaTunis.name} (${wakalaTunis.code})`);
    console.log(`   Tenant ID: ${wakalaTunis.id}`);
    console.log(`   Role: ADMIN\n`);

    // Afficher tous les tenants de l'admin
    const userTenants = await prisma.tenantUser.findMany({
        where: { userId: admin.id },
        include: {
            Tenant: true,
            Role: true,
        },
    });

    console.log(`📋 Admin now has access to ${userTenants.length} wakala(s):`);
    for (const ut of userTenants) {
        console.log(`   - ${ut.Tenant.name} (${ut.Tenant.code}) - Role: ${ut.Role.name}`);
        console.log(`     Tenant ID: ${ut.Tenant.id}`);
    }

    await prisma.$disconnect();
}

addAdminToWakalaTunis().catch(console.error);
