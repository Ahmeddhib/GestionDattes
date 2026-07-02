import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Script pour insérer un admin - MULTI-TENANT VERSION
 * Note: Ce script est obsolète. Utilisez prisma/seed.ts pour initialiser les données
 * ou scripts/add-admin-to-wakala-tunis.ts pour ajouter un admin à un tenant
 */
async function main() {
    console.log('⚠️  Ce script est obsolète pour le système multi-tenant.');
    console.log('Utilisez plutôt:');
    console.log('  - bun prisma db seed (pour initialiser toutes les données)');
    console.log('  - scripts/add-admin-to-wakala-tunis.ts (pour ajouter un admin à un tenant)');

    // Ancien code commenté pour référence:
    // const role = await prisma.role.findUnique({where: {name: 'ADMIN'}});
    // if (!role) throw new Error("ADMIN role not found");
    // 
    // await prisma.user.upsert({
    //     where: { email: 'admin@dattes.tn' },
    //     update: {},
    //     create: {
    //         name: 'Super Admin',
    //         email: 'admin@dattes.tn',
    //         password: await bcrypt.hash('admin123', 10),
    //         roleId: role.id,  // ❌ N'existe plus dans le schéma multi-tenant
    //         active: true
    //     }
    // });
}

main().finally(() => prisma.$disconnect());
