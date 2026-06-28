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
        { name: "AGENT", description: "Agent de réception des livraisons" },
        { name: "LABORANTIN", description: "Laborantin avec accès aux analyses" },
        { name: "RESPONSABLE_STOCK", description: "Responsable de la gestion des stocks" },
        { name: "DIRECTION", description: "Direction avec accès aux rapports" },
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

    // 2. Créer les utilisateurs
    console.log("\n👤 Création des utilisateurs...");
    const users = [
        { name: "Super Admin", email: "admin@dattes.tn", role: "ADMIN" },
        { name: "Agent Réception", email: "agent@dattes.tn", role: "AGENT" },
        { name: "Laborantin Principal", email: "labo@dattes.tn", role: "LABORANTIN" },
        { name: "Responsable Stock", email: "stock@dattes.tn", role: "RESPONSABLE_STOCK" },
    ];

    for (const user of users) {
        const existing = await sql`SELECT * FROM "User" WHERE email = ${user.email} LIMIT 1`;

        if (existing.length > 0) {
            console.log(`✅ ${user.name} existe déjà`);
        } else {
            const password = await bcrypt.hash("admin123", 10);
            const id = randomUUID();
            const roleId = roleIds[user.role];

            await sql`
                INSERT INTO "User" (id, name, email, password, "roleId", active, "createdAt", "updatedAt")
                VALUES (
                    ${id},
                    ${user.name},
                    ${user.email},
                    ${password},
                    ${roleId},
                    true,
                    NOW(),
                    NOW()
                )
            `;

            console.log(`✅ ${user.name} créé avec succès!`);
        }
    }

    // 3. Créer les régions
    console.log("\n🗺️ Création des régions...");
    const regions = [
        { nom: "Kebili", code: "KB" },
        { nom: "Tozeur", code: "TZ" },
        { nom: "Gabès", code: "GB" },
        { nom: "Gafsa", code: "GF" },
    ];

    const regionIds: Record<string, string> = {};

    for (const region of regions) {
        const existing = await sql`SELECT id FROM "Region" WHERE code = ${region.code}`;
        if (existing.length > 0) {
            regionIds[region.code] = existing[0].id;
            console.log(`✅ Région ${region.nom} existe déjà`);
        } else {
            const id = randomUUID();
            await sql`
                INSERT INTO "Region" (id, nom, code, "createdAt", "updatedAt")
                VALUES (${id}, ${region.nom}, ${region.code}, NOW(), NOW())
            `;
            regionIds[region.code] = id;
            console.log(`✅ Région ${region.nom} créée`);
        }
    }

    // 4. Créer les types de dattes
    console.log("\n🌴 Création des types de dattes...");
    const typeDattes = [
        { nom: "Deglet Nour", description: "Datte de qualité supérieure, translucide" },
        { nom: "Allig", description: "Datte moelleuse et sucrée" },
        { nom: "Kenta", description: "Datte sèche de bonne conservation" },
        { nom: "Kentichi", description: "Datte mi-molle de qualité" },
    ];

    const typeDateIds: Record<string, string> = {};

    for (const type of typeDattes) {
        const existing = await sql`SELECT id FROM "TypeDate" WHERE nom = ${type.nom}`;
        if (existing.length > 0) {
            typeDateIds[type.nom] = existing[0].id;
            console.log(`✅ Type ${type.nom} existe déjà`);
        } else {
            const id = randomUUID();
            await sql`
                INSERT INTO "TypeDate" (id, nom, description, "createdAt", "updatedAt")
                VALUES (${id}, ${type.nom}, ${type.description}, NOW(), NOW())
            `;
            typeDateIds[type.nom] = id;
            console.log(`✅ Type ${type.nom} créé`);
        }
    }

    // 5. Créer les types de caisses
    console.log("\n📦 Création des types de caisses...");
    const typeCaisses = [
        { nom: "Caisse 5kg", poidsKg: 5.0 },
        { nom: "Caisse 10kg", poidsKg: 10.0 },
        { nom: "Caisse 20kg", poidsKg: 20.0 },
        { nom: "Palette 500kg", poidsKg: 500.0 },
    ];

    const typeCaisseIds: Record<string, string> = {};

    for (const caisse of typeCaisses) {
        const existing = await sql`SELECT id FROM "TypeCaisse" WHERE nom = ${caisse.nom}`;
        if (existing.length > 0) {
            typeCaisseIds[caisse.nom] = existing[0].id;
            console.log(`✅ Type caisse ${caisse.nom} existe déjà`);
        } else {
            const id = randomUUID();
            await sql`
                INSERT INTO "TypeCaisse" (id, nom, "poidsKg", "createdAt", "updatedAt")
                VALUES (${id}, ${caisse.nom}, ${caisse.poidsKg}, NOW(), NOW())
            `;
            typeCaisseIds[caisse.nom] = id;
            console.log(`✅ Type caisse ${caisse.nom} créé`);
        }
    }

    // 6. Créer des agriculteurs de démonstration
    console.log("\n👨‍🌾 Création des agriculteurs...");
    const agriculteurs = [
        {
            code: "AGR001",
            cin: "12345678",
            nom: "Ben Ahmed",
            prenom: "Mohamed",
            telephone: "+216 98 123 456",
            adresse: "Douz, Kebili",
            nbPalmiers: 150,
            superficie: 2.5,
            productionEstimee: 3000,
            region: "KB",
        },
        {
            code: "AGR002",
            cin: "23456789",
            nom: "Trabelsi",
            prenom: "Fatma",
            telephone: "+216 97 234 567",
            adresse: "Nefta, Tozeur",
            nbPalmiers: 200,
            superficie: 3.0,
            productionEstimee: 4500,
            region: "TZ",
        },
        {
            code: "AGR003",
            cin: "34567890",
            nom: "Gharbi",
            prenom: "Ali",
            telephone: "+216 96 345 678",
            adresse: "Matmata, Gabès",
            nbPalmiers: 100,
            superficie: 1.8,
            productionEstimee: 2000,
            region: "GB",
        },
    ];

    for (const agri of agriculteurs) {
        const existing = await sql`SELECT id FROM "Agriculteur" WHERE code = ${agri.code}`;
        if (existing.length > 0) {
            console.log(`✅ Agriculteur ${agri.nom} ${agri.prenom} existe déjà`);
        } else {
            const id = randomUUID();
            const regionId = regionIds[agri.region];
            await sql`
                INSERT INTO "Agriculteur" (
                    id, code, cin, nom, prenom, telephone, adresse,
                    "nbPalmiers", superficie, "productionEstimee",
                    "regionId", "createdAt", "updatedAt"
                )
                VALUES (
                    ${id}, ${agri.code}, ${agri.cin}, ${agri.nom}, ${agri.prenom},
                    ${agri.telephone}, ${agri.adresse}, ${agri.nbPalmiers},
                    ${agri.superficie}, ${agri.productionEstimee}, ${regionId},
                    NOW(), NOW()
                )
            `;
            console.log(`✅ Agriculteur ${agri.nom} ${agri.prenom} créé`);
        }
    }

    // 7. Créer des clients de démonstration
    console.log("\n🏢 Création des clients...");
    const clients = [
        {
            nom: "Export Dattes Tunisia",
            telephone: "+216 71 123 456",
            adresse: "Zone Industrielle, Tunis",
            email: "export@dattes-tunisia.tn",
        },
        {
            nom: "Supermarché Carrefour",
            telephone: "+216 71 234 567",
            adresse: "Lac 2, Tunis",
            email: "achat@carrefour.tn",
        },
    ];

    for (const client of clients) {
        const existing = await sql`SELECT id FROM "Client" WHERE nom = ${client.nom}`;
        if (existing.length > 0) {
            console.log(`✅ Client ${client.nom} existe déjà`);
        } else {
            const id = randomUUID();
            await sql`
                INSERT INTO "Client" (id, nom, telephone, adresse, email, "createdAt", "updatedAt")
                VALUES (${id}, ${client.nom}, ${client.telephone}, ${client.adresse}, ${client.email}, NOW(), NOW())
            `;
            console.log(`✅ Client ${client.nom} créé`);
        }
    }

    console.log("\n🎉 Seed terminé!");
    console.log("\n📧 Comptes utilisateurs créés:");
    console.log("   Admin:       admin@dattes.tn / admin123");
    console.log("   Agent:       agent@dattes.tn / admin123");
    console.log("   Laborantin:  labo@dattes.tn / admin123");
    console.log("   Stock:       stock@dattes.tn / admin123");
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors du seed:", e);
        process.exit(1);
    });
