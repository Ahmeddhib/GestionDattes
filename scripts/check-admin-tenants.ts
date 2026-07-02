import { prisma } from "../src/lib/prisma";

async function checkAdminTenants() {
    console.log("🔍 Checking admin user tenants...\n");

    const user = await prisma.user.findUnique({
        where: { email: "admin@dattes.tn" },
        include: {
            TenantUser: {
                include: {
                    Tenant: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            active: true,
                        }
                    },
                    Role: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log("❌ User admin@dattes.tn not found!");
        return;
    }

    console.log("✅ User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Active: ${user.active}\n`);

    console.log(`📋 Tenants (${user.TenantUser.length}):`);
    for (const tu of user.TenantUser) {
        console.log(`   - ${tu.Tenant.name} (${tu.Tenant.code})`);
        console.log(`     Tenant ID: ${tu.Tenant.id}`);
        console.log(`     Role: ${tu.Role.name}`);
        console.log(`     Active: ${tu.active}`);
        console.log("");
    }

    await prisma.$disconnect();
}

checkAdminTenants().catch(console.error);
