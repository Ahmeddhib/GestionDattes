/**
 * Script de Rollback Multi-Tenant
 * 
 * Restaure le schema Prisma original en cas de problème
 * 
 * Usage:
 *   node scripts/rollback-multitenant.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Rollback Multi-Tenant - Début\n');

// 1. Restaurer le schema
console.log('📦 1. Restauration du schema original...');
const currentSchema = path.join(__dirname, '../prisma/schema.prisma');
const backupSchema = path.join(__dirname, '../prisma/schema.prisma.backup');

if (fs.existsSync(backupSchema)) {
    fs.copyFileSync(backupSchema, currentSchema);
    console.log('✅ Schema original restauré\n');
} else {
    console.log('❌ Backup non trouvé!\n');
    process.exit(1);
}

// 2. Instructions
console.log('📋 2. Prochaines étapes:\n');
console.log('   a) Regénérer le client Prisma:');
console.log('      bunx prisma generate\n');
console.log('   b) Si nécessaire, restaurer la base depuis backup:');
console.log('      psql $DATABASE_URL < backup_YYYYMMDD.sql\n');
console.log('   c) Redémarrer le serveur:');
console.log('      bun run dev\n');

console.log('✅ Rollback terminé!\n');
