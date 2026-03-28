import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const CreateTaskSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must not exceed 200 characters')
        .trim(),
    description: z.string().max(2000, 'Description too long').trim().optional(),
    status: z.nativeEnum(TaskStatus).default('TODO'),
    priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
    dueDate: z.string().datetime({ offset: true }).optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TaskQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    search: z.string().trim().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>;
