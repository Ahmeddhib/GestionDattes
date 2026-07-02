/**
 * Script de Migration Multi-Tenant
 * 
 * Ce script aide à migrer l'application vers une architecture multi-tenant
 * 
 * Usage:
 *   node scripts/migrate-to-multitenant.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Migration Multi-Tenant - Début\n');

// 1. Backup du schema actuel
console.log('📦 1. Backup du schema Prisma actuel...');
const currentSchema = path.join(__dirname, '../prisma/schema.prisma');
const backupSchema = path.join(__dirname, '../prisma/schema.prisma.backup');

if (fs.existsSync(currentSchema)) {
    fs.copyFileSync(currentSchema, backupSchema);
    console.log('✅ Backup créé: prisma/schema.prisma.backup\n');
} else {
    console.log('⚠️  Schema actuel non trouvé\n');
}

// 2. Remplacer par le nouveau schema
console.log('📝 2. Remplacement par le schema multi-tenant...');
const multitenantSchema = path.join(__dirname, '../prisma/schema-multitenant.prisma');
if (fs.existsSync(multitenantSchema)) {
    fs.copyFileSync(multitenantSchema, currentSchema);
    console.log('✅ Schema multi-tenant activé\n');
} else {
    console.log('❌ Schema multi-tenant non trouvé!\n');
    process.exit(1);
}

// 3. Instructions pour la suite
console.log('📋 3. Prochaines étapes:\n');
console.log('   a) Générer le client Prisma:');
console.log('      bunx prisma generate\n');
console.log('   b) Exécuter la migration SQL:');
console.log('      psql $DATABASE_URL < prisma/migrations/add_multitenant/migration.sql\n');
console.log('   c) Vérifier avec Prisma Studio:');
console.log('      bunx prisma studio\n');
console.log('   d) Redémarrer le serveur:');
console.log('      bun run dev\n');

console.log('⚠️  IMPORTANT: Assurez-vous d\'avoir fait un backup de la base de données!\n');
console.log('✅ Migration du schema terminée!\n');
