const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
    const client = new Client({
        connectionString: process.env.DIRECT_URL,
    });

    try {
        console.log('🔌 Connexion à la base de données...');
        await client.connect();
        console.log('✅ Connecté');

        // Lire le fichier de migration
        const migrationPath = path.join(__dirname, '../prisma/migrations/add_stock_caisses.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');

        console.log('\n📋 Application de la migration...');
        await client.query(migration);
        console.log('✅ Migration appliquée avec succès');

        // Vérifier que la colonne existe
        const check = await client.query(`
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'TypeCaisse' AND column_name = 'stockDisponible'
        `);

        if (check.rows.length > 0) {
            console.log('\n✅ Colonne stockDisponible créée:');
            console.log(check.rows[0]);
        }

        // Initialiser les stocks pour les types existants
        console.log('\n🔄 Initialisation des stocks...');
        const result = await client.query(`
            UPDATE "TypeCaisse" 
            SET "stockDisponible" = 100 
            WHERE "stockDisponible" = 0
            RETURNING id, nom, "stockDisponible"
        `);

        if (result.rows.length > 0) {
            console.log(`✅ ${result.rows.length} types de caisses initialisés avec stock = 100`);
            result.rows.forEach(row => {
                console.log(`  - ${row.nom}: ${row.stockDisponible} caisses`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Déconnexion réussie');
    }
}

applyMigration();
