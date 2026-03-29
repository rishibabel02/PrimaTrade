import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { BadRequest } from '../../middleware/errorHandler';
import { routeParam } from '../../utils/routeParams';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from './tasks.schema';
import * as tasksService from './tasks.service';

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
    const query = TaskQuerySchema.parse(req.query);
    const result = await tasksService.listTasks(req.user!.sub, req.user!.role, query);
    sendSuccess(res, result.tasks, 'Tasks fetched', 200, result.meta);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await tasksService.getStats(req.user!.sub, req.user!.role);
    sendSuccess(res, stats, 'Stats fetched');
});


export const getTask = asyncHandler(async (req: Request, res: Response) => {
    const taskId = routeParam(req, 'id');
    if (!taskId) throw BadRequest('Task id is required');
    const task = await tasksService.getTaskById(taskId, req.user!.sub, req.user!.role);
    sendSuccess(res, task, 'Task fetched');
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
    const input = CreateTaskSchema.parse(req.body);
    const task = await tasksService.createTask(req.user!.sub, input);
    sendSuccess(res, task, 'Task created', 201);
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const taskId = routeParam(req, 'id');
    if (!taskId) throw BadRequest('Task id is required');
    const input = UpdateTaskSchema.parse(req.body);
    const task = await tasksService.updateTask(taskId, req.user!.sub, req.user!.role, input);
    sendSuccess(res, task, 'Task updated');
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const taskId = routeParam(req, 'id');
    if (!taskId) throw BadRequest('Task id is required');
    await tasksService.deleteTask(taskId, req.user!.sub, req.user!.role);
    sendSuccess(res, null, 'Task deleted');
});
