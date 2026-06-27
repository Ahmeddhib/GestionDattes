import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import "dotenv/config";

const sql = neon(process.env.DIRECT_URL || process.env.DATABASE_URL!);

async function main() {
    console.log("🌱 Début du seed...");

    // 1. Créer les rôles
    console.log("\n📋 Création des rôles...");
    const roles = [
        { name: "ADMIN", description: "Administrateur avec tous les droits" },
        { name: "AGENT", description: "Agent avec droits limités" },
        { name: "LABORANTIN", description: "Laborantin avec accès aux analyses" },
    ];

    const roleIds: Record<string, string> = {};

    for (const role of roles) {
        const existing = await sql`SELECT id FROM "Role" WHERE name = ${role.name}`;
        if (existing.length > 0) {
            roleIds[role.name] = existing[0].id;
            console.log(`✅ Rôle ${role.name} existe déjà`);
        } else {
            const id = randomUUID();
            await sql`
                INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt")
                VALUES (${id}, ${role.name}, ${role.description}, NOW(), NOW())
            `;
            roleIds[role.name] = id;
            console.log(`✅ Rôle ${role.name} créé`);
        }
    }

    // 2. Créer l'admin
    console.log("\n👤 Création de l'utilisateur admin...");
    const existingAdmin = await sql`
        SELECT * FROM "User" WHERE email = 'admin@dattes.tn' LIMIT 1
    `;

    if (existingAdmin.length > 0) {
        console.log("✅ L'admin existe déjà");
    } else {
        const password = await bcrypt.hash("admin123", 10);
        const id = randomUUID();
        const adminRoleId = roleIds["ADMIN"];

        await sql`
            INSERT INTO "User" (id, name, email, password, "roleId", active, "createdAt", "updatedAt")
            VALUES (
                ${id},
                'Super Admin',
                'admin@dattes.tn',
                ${password},
                ${adminRoleId},
                true,
                NOW(),
                NOW()
            )
        `;

        console.log("✅ Admin créé avec succès!");
    }

    console.log("\n🎉 Seed terminé!");
    console.log("📧 Email: admin@dattes.tn");
    console.log("🔑 Mot de passe: admin123");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed:", e);
        process.exit(1);
    });
