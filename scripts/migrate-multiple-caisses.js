/**
 * Script de migration: Ajouter support pour plusieurs types de caisses par livraison
 * Usage: node scripts/migrate-multiple-caisses.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const { neonConfig, Pool } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');
const dotenv = require('dotenv');

// Configuration pour WebSocket
neonConfig.webSocketConstructor = ws;

// Chargement de la configuration depuis .env
dotenv.config();

const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    console.error('❌ DIRECT_URL not found in .env file');
    process.exit(1);
}

console.log('🔄 Starting migration: Add multiple TypeCaisses per Livraison...\n');

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function runMigration() {
    try {
        // Step 1: Create the new table
        console.log('📦 Step 1: Creating LivraisonTypeCaisse table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "LivraisonTypeCaisse" (
                "id" TEXT NOT NULL,
                "livraisonId" TEXT NOT NULL,
                "typeCaisseId" TEXT NOT NULL,
                "quantite" INTEGER NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "LivraisonTypeCaisse_pkey" PRIMARY KEY ("id")
            )
        `);
        console.log('✅ Table created\n');

        // Step 2: Create indexes
        console.log('📇 Step 2: Creating indexes...');
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "LivraisonTypeCaisse_livraisonId_typeCaisseId_key" 
            ON "LivraisonTypeCaisse"("livraisonId", "typeCaisseId")
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "LivraisonTypeCaisse_livraisonId_idx" 
            ON "LivraisonTypeCaisse"("livraisonId")
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "LivraisonTypeCaisse_typeCaisseId_idx" 
            ON "LivraisonTypeCaisse"("typeCaisseId")
        `);
        console.log('✅ Indexes created\n');

        // Step 3: Add foreign keys
        console.log('🔗 Step 3: Adding foreign keys...');
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "LivraisonTypeCaisse" 
                ADD CONSTRAINT "LivraisonTypeCaisse_livraisonId_fkey" 
                FOREIGN KEY ("livraisonId") REFERENCES "Livraison"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch (e) {
            if (!e.message.includes('already exists')) throw e;
            console.log('⚠️  Foreign key already exists (livraisonId)');
        }

        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "LivraisonTypeCaisse" 
                ADD CONSTRAINT "LivraisonTypeCaisse_typeCaisseId_fkey" 
                FOREIGN KEY ("typeCaisseId") REFERENCES "TypeCaisse"("id") 
                ON UPDATE CASCADE
            `);
        } catch (e) {
            if (!e.message.includes('already exists')) throw e;
            console.log('⚠️  Foreign key already exists (typeCaisseId)');
        }
        console.log('✅ Foreign keys added\n');

        // Step 4: Migrate existing data
        console.log('🔄 Step 4: Migrating existing data...');

        // Check if there are existing livraisons with typeCaisseId
        const livraisonsCount = await prisma.$queryRaw`
            SELECT COUNT(*) as count 
            FROM "Livraison" 
            WHERE "typeCaisseId" IS NOT NULL
        `;

        const count = Number(livraisonsCount[0]?.count || 0);
        console.log(`   Found ${count} livraisons to migrate`);

        if (count > 0) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO "LivraisonTypeCaisse" ("id", "livraisonId", "typeCaisseId", "quantite", "createdAt")
                SELECT 
                    gen_random_uuid()::text as id,
                    l."id" as "livraisonId",
                    l."typeCaisseId",
                    CEIL(l."quantiteKg" / tc."poidsKg")::INTEGER as quantite,
                    l."createdAt"
                FROM "Livraison" l
                INNER JOIN "TypeCaisse" tc ON l."typeCaisseId" = tc."id"
                WHERE l."typeCaisseId" IS NOT NULL AND l."quantiteKg" IS NOT NULL
                ON CONFLICT ("livraisonId", "typeCaisseId") DO NOTHING
            `);
            console.log(`✅ Migrated ${count} records\n`);
        } else {
            console.log('✅ No data to migrate\n');
        }

        // Step 5: Drop old columns
        console.log('🗑️  Step 5: Removing old columns...');

        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "Livraison" DROP CONSTRAINT IF EXISTS "Livraison_typeCaisseId_fkey"
            `);
            console.log('   ✓ Dropped foreign key constraint');
        } catch (e) {
            console.log('   ⚠️  No foreign key to drop');
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Livraison" DROP COLUMN IF EXISTS "typeCaisseId"`);
            console.log('   ✓ Dropped typeCaisseId column');
        } catch (e) {
            console.log('   ⚠️  typeCaisseId column already dropped');
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "Livraison" DROP COLUMN IF EXISTS "quantiteKg"`);
            console.log('   ✓ Dropped quantiteKg column');
        } catch (e) {
            console.log('   ⚠️  quantiteKg column already dropped');
        }

        console.log('✅ Old columns removed\n');

        console.log('🎉 Migration completed successfully!\n');
        console.log('Summary:');
        console.log('  - Created LivraisonTypeCaisse table');
        console.log('  - Migrated existing livraisons');
        console.log('  - Removed old typeCaisseId and quantiteKg columns from Livraison');
        console.log('\n✨ Now run: bunx prisma generate');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

runMigration();
