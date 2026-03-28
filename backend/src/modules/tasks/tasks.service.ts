import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { Forbidden, NotFound } from '../../middleware/errorHandler';
import type { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from './tasks.schema';

const TASK_SELECT = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    createdAt: true,
    updatedAt: true,
    user: { select: { id: true, name: true, email: true } },
} as const;

export async function listTasks(
    userId: string,
    userRole: Role,
    query: TaskQueryInput
) {
    const { page, limit, status, priority, search } = query;
    const skip = (page - 1) * limit;

    // Admins can see all tasks; users see only their own
    const ownerFilter = userRole === Role.ADMIN ? {} : { userId };

    const where = {
        ...ownerFilter,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
            ],
        }),
    };

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            select: TASK_SELECT,
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.task.count({ where }),
    ]);

    return {
        tasks,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function getTaskById(taskId: string, userId: string, userRole: Role) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: TASK_SELECT });
    if (!task) throw NotFound('Task not found');
    if (userRole !== Role.ADMIN && task.user.id !== userId) throw Forbidden();
    return task;
}

export async function createTask(userId: string, input: CreateTaskInput) {
    return prisma.task.create({
        data: {
            ...input,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            userId,
        },
        select: TASK_SELECT,
    });
}

export async function updateTask(
    taskId: string,
    userId: string,
    userRole: Role,
    input: UpdateTaskInput
) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw NotFound('Task not found');
    if (userRole !== Role.ADMIN && existing.userId !== userId) throw Forbidden();

    return prisma.task.update({
        where: { id: taskId },
        data: {
            ...input,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        },
        select: TASK_SELECT,
    });
}

export async function deleteTask(taskId: string, userId: string, userRole: Role) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw NotFound('Task not found');
    if (userRole !== Role.ADMIN && existing.userId !== userId) throw Forbidden();

    await prisma.task.delete({ where: { id: taskId } });
}
