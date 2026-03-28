import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminHash = await bcrypt.hash('Admin@1234', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@primetrade.ai' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@primetrade.ai',
            passwordHash: adminHash,
            role: 'ADMIN',
        },
    });

    // Create regular user
    const userHash = await bcrypt.hash('User@1234', 12);
    const user = await prisma.user.upsert({
        where: { email: 'user@primetrade.ai' },
        update: {},
        create: {
            name: 'Demo User',
            email: 'user@primetrade.ai',
            passwordHash: userHash,
            role: 'USER',
        },
    });

    // Seed some tasks for the demo user
    const tasks = [
        {
            title: 'Set up project repository',
            description: 'Initialize GitHub repo, add README and .gitignore',
            status: 'DONE' as const,
            priority: 'HIGH' as const,
        },
        {
            title: 'Design database schema',
            description: 'Define User, Task, and RefreshToken models in Prisma',
            status: 'DONE' as const,
            priority: 'HIGH' as const,
        },
        {
            title: 'Implement authentication',
            description: 'JWT access + refresh tokens with bcrypt hashing',
            status: 'IN_PROGRESS' as const,
            priority: 'HIGH' as const,
        },
        {
            title: 'Build CRUD APIs',
            description: 'Tasks entity with RBAC ownership controls',
            status: 'TODO' as const,
            priority: 'MEDIUM' as const,
        },
        {
            title: 'Write Swagger documentation',
            description: 'Document all endpoints with JSDoc annotations',
            status: 'TODO' as const,
            priority: 'MEDIUM' as const,
        },
        {
            title: 'Build React frontend',
            description: 'Login, register, dashboard, and task management UI',
            status: 'TODO' as const,
            priority: 'LOW' as const,
        },
    ];

    for (const task of tasks) {
        await prisma.task.create({ data: { ...task, userId: user.id } });
    }

    console.log(`✅ Seeded admin: ${admin.email}`);
    console.log(`✅ Seeded user: ${user.email}`);
    console.log(`✅ Seeded ${tasks.length} tasks`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
