import { config } from "dotenv";
import { prisma } from "../src/lib/prisma";

// Load environment variables
config();

async function checkTenants() {
    try {
        console.log("🔍 Checking tenants in database...");

        const tenants = await prisma.tenant.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });

        console.log(`✅ Found ${tenants.length} tenant(s):`);
        tenants.forEach((tenant) => {
            console.log(`  - ${tenant.name} (${tenant.code}) - Active: ${tenant.active}`);
        });

        if (tenants.length === 0) {
            console.log("⚠️ No tenants found. Creating default Wakala...");

            const defaultTenant = await prisma.tenant.create({
                data: {
                    name: "Wakala Principale",
                    code: "MAIN",
                    active: true,
                    address: "Tunis, Tunisie",
                    phone: "+216 XX XX XX XX",
                    email: "contact@dattes.tn",
                },
            });

            console.log(`✅ Created default tenant: ${defaultTenant.name} (${defaultTenant.code})`);
        }
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTenants();
