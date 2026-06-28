#!/usr/bin/env node

/**
 * Script pour générer AUTH_SECRET pour NextAuth
 * Usage: node scripts/generate-auth-secret.js
 */

const crypto = require('crypto');

console.log('\n🔐 Génération AUTH_SECRET pour NextAuth\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const secret = crypto.randomBytes(32).toString('base64');

console.log('Votre nouveau AUTH_SECRET:\n');
console.log(`  ${secret}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Instructions:\n');
console.log('1. Allez sur vercel.com → Votre projet');
console.log('2. Settings → Environment Variables');
console.log('3. Ajoutez une nouvelle variable:');
console.log('   Nom: AUTH_SECRET');
console.log(`   Valeur: ${secret}`);
console.log('4. Sélectionnez: Production + Preview + Development');
console.log('5. Cliquez "Save"\n');
console.log('⚠️  IMPORTANT: Ne commitez JAMAIS ce secret dans Git!\n');
