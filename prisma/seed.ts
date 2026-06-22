import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import "dotenv/config";

const sql = neon(process.env.DIRECT_URL || process.env.DATABASE_URL!);

async function main() {
    console.log("🌱 Début du seed...");

    // Vérifier si l'admin existe déjà
    const existingAdmin = await sql`
        SELECT * FROM "User" WHERE email = 'admin@dattes.tn' LIMIT 1
    `;

    if (existingAdmin.length > 0) {
        console.log("✅ L'admin existe déjà");
        return;
    }

    // Créer le mot de passe hashé
    const password = await bcrypt.hash("admin123", 10);
    const id = randomUUID();

    // Créer l'admin
    await sql`
        INSERT INTO "User" (id, name, email, password, role, active, "createdAt", "updatedAt")
        VALUES (
            ${id},
            'Super Admin',
            'admin@dattes.tn',
            ${password},
            'ADMIN',
            true,
            NOW(),
            NOW()
        )
    `;

    console.log("✅ Admin créé avec succès!");
    console.log("📧 Email: admin@dattes.tn");
    console.log("🔑 Mot de passe: admin123");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed:", e);
        process.exit(1);
    });
