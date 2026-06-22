import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

console.log("Test de connexion à Neon...");

try {
    // Test simple
    const result = await sql`SELECT NOW() as time`;
    console.log("✅ Connexion réussie!");
    console.log("Heure du serveur:", result[0].time);

    // Créer les tables
    console.log("\nCréation des tables...");

    await sql`
    CREATE TABLE IF NOT EXISTS "Role" (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );
  `;
    console.log("✓ Table Role créée");

    await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      "roleId" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") 
        REFERENCES "Role"(id) ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `;
    console.log("✓ Table User créée");

    await sql`CREATE INDEX IF NOT EXISTS "User_roleId_idx" ON "User"("roleId");`;
    await sql`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"(email);`;
    console.log("✓ Index créés");

    console.log("\n✅ Toutes les tables ont été créées avec succès!");
} catch (error) {
    console.error("❌ Erreur:", error);
}
