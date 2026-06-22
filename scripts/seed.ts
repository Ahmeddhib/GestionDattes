import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    console.log("Seeding database...");

    const roleAdmin = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
            name: 'ADMIN',
            description: 'Administrateur principal',
        },
    });

    await prisma.role.upsert({
        where: { name: 'AGENT' },
        update: {},
        create: {
            name: 'AGENT',
            description: 'Agent de saisie',
        },
    });

    await prisma.role.upsert({
        where: { name: 'LABORANTIN' },
        update: {},
        create: {
            name: 'LABORANTIN',
            description: 'Responsable du laboratoire',
        },
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.upsert({
        where: { email: 'admin@gestion-dattes.com' },
        update: {},
        create: {
            name: 'Administrateur',
            email: 'admin@gestion-dattes.com',
            password: hashedPassword,
            roleId: roleAdmin.id,
            active: true,
        },
    });

    console.log("Seed completed. Admin email: admin@gestion-dattes.com, password: admin123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
