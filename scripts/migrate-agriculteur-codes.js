/**
 * Script de migration pour mettre à jour les codes des agriculteurs
 * au format AGR-0001, AGR-0002, etc. par tenant
 * 
 * Usage: node scripts/migrate-agriculteur-codes.js
 */

require('dotenv').config();
const { neonConfig } = require("@neondatabase/serverless");
const { PrismaClient } = require("../src/generated/prisma");
const { PrismaNeon } = require("@prisma/adapter-neon");
const ws = require("ws");

neonConfig.webSocketConstructor = ws;

// Créer le client Prisma avec l'adaptateur Neon
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function migrateAgriculteurCodes() {
    console.log('🚀 Démarrage de la migration des codes agriculteurs...\n');

    try {
        // Récupérer tous les tenants
        const tenants = await prisma.tenant.findMany({
            orderBy: { createdAt: 'asc' }
        });

        console.log(`📊 ${tenants.length} tenant(s) trouvé(s)\n`);

        let totalUpdated = 0;

        for (const tenant of tenants) {
            console.log(`\n🏢 Traitement du tenant: ${tenant.name} (ID: ${tenant.id})`);

            // Récupérer tous les agriculteurs de ce tenant, triés par date de création
            const agriculteurs = await prisma.agriculteur.findMany({
                where: { tenantId: tenant.id },
                orderBy: { createdAt: 'asc' }
            });

            console.log(`   📋 ${agriculteurs.length} agriculteur(s) trouvé(s)`);

            if (agriculteurs.length === 0) {
                console.log('   ⏭️  Aucun agriculteur à migrer');
                continue;
            }

            // ÉTAPE 1: Attribuer des codes temporaires pour éviter les conflits d'unicité
            console.log('   🔄 Étape 1: Attribution de codes temporaires...');
            for (let i = 0; i < agriculteurs.length; i++) {
                const agriculteur = agriculteurs[i];
                const tempCode = `TEMP-${tenant.id}-${i}`;

                await prisma.agriculteur.update({
                    where: { id: agriculteur.id },
                    data: { code: tempCode }
                });
            }

            // ÉTAPE 2: Attribuer les codes définitifs
            console.log('   ✅ Étape 2: Attribution des codes définitifs...');
            let counter = 1;
            for (const agriculteur of agriculteurs) {
                const oldCode = agriculteur.code;
                const newCode = `AGR-${String(counter).padStart(4, '0')}`;

                await prisma.agriculteur.update({
                    where: { id: agriculteur.id },
                    data: { code: newCode }
                });

                console.log(`   ✅ ${oldCode} → ${newCode} (${agriculteur.nom} ${agriculteur.prenom})`);
                counter++;
                totalUpdated++;
            }

            console.log(`   ✓ ${agriculteurs.length} code(s) mis à jour pour ce tenant`);
        }

        console.log(`\n✨ Migration terminée avec succès!`);
        console.log(`📈 Total de codes mis à jour: ${totalUpdated}`);

    } catch (error) {
        console.error('\n❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter la migration
migrateAgriculteurCodes()
    .then(() => {
        console.log('\n✅ Script terminé avec succès');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    });
