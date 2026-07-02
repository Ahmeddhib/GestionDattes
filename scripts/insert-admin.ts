/**
 * ⚠️ CE SCRIPT EST OBSOLÈTE - UTILISER prisma/seed.ts
 * 
 * Ce script a été désactivé car il utilise l'ancien modèle non multi-tenant.
 * Pour le système multi-tenant actuel, utilisez:
 * 
 * bun prisma db seed
 * 
 * Le script correct se trouve dans prisma/seed.ts
 */

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('⚠️  Ce script est obsolète pour le système multi-tenant.');
    console.log('Utilisez à la place:');
    console.log('  bun prisma db seed');
    console.log('');
    console.log('Le script actif se trouve dans: prisma/seed.ts');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
