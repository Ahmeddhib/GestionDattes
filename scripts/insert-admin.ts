import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const role = await prisma.role.findUnique({where: {name: 'ADMIN'}});
    if (!role) throw new Error("ADMIN role not found");
    
    await prisma.user.upsert({
        where: { email: 'admin@dattes.tn' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@dattes.tn',
            password: await bcrypt.hash('admin123', 10),
            roleId: role.id,
            active: true
        }
    });
    console.log('admin@dattes.tn added');
}

main().finally(() => prisma.$disconnect());
