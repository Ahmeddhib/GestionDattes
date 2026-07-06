// Script pour ajouter la colonne stockDisponible à TypeCaisse
// Utilise directement la connexion PostgreSQL

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function addStockColumn() {
    console.log('🚀 Début de la migration...\n');

    // Utiliser l'URL directe pour les migrations
    const sql = neon(process.env.DIRECT_URL || process.env.DATABASE_URL);

    try {
        // 1. Vérifier si la colonne existe déjà
        console.log('🔍 Vérification de la colonne stockDisponible...');
        const checkColumn = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'TypeCaisse' 
            AND column_name = 'stockDisponible'
        `;

        if (checkColumn.length > 0) {
            console.log('✅ La colonne stockDisponible existe déjà!');
            return;
        }

        // 2. Ajouter la colonne
        console.log('📝 Ajout de la colonne stockDisponible...');
        await sql`
            ALTER TABLE "TypeCaisse" 
            ADD COLUMN "stockDisponible" INTEGER NOT NULL DEFAULT 0
        `;
        console.log('✅ Colonne ajoutée');

        // 3. Créer l'index
        console.log('📝 Création de l\'index...');
        await sql`
            CREATE INDEX IF NOT EXISTS "TypeCaisse_stockDisponible_idx" 
            ON "TypeCaisse"("stockDisponible")
        `;
        console.log('✅ Index créé');

        // 4. Initialiser les stocks à 100 pour tous les types existants
        console.log('\n📦 Initialisation des stocks...');
        const result = await sql`
            UPDATE "TypeCaisse" 
            SET "stockDisponible" = 100 
            WHERE "stockDisponible" = 0
            RETURNING id, nom, "stockDisponible"
        `;

        console.log(`✅ ${result.length} types de caisses initialisés:`);
        result.forEach(row => {
            console.log(`   - ${row.nom}: ${row.stockDisponible} caisses`);
        });

        console.log('\n🎉 Migration terminée avec succès!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

addStockColumn();
