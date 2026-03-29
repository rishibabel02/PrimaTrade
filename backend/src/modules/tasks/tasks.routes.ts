import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as tasksController from './tasks.controller';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: List tasks (own tasks for users, all tasks for admins)
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on title and description
 *     responses:
 *       200:
 *         description: Paginated task list with meta
 */
router.get('/', tasksController.listTasks);

/**
 * @openapi
 * /tasks/stats:
 *   get:
 *     summary: Get task counts grouped by status
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: Task counts by status
 */
router.get('/stats', tasksController.getStats);


/**
 * @openapi
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Write unit tests
 *               description:
 *                 type: string
 *                 example: Cover the auth module with Jest
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *                 default: TODO
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 default: MEDIUM
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 *       422:
 *         description: Validation failed
 */
router.post('/', tasksController.createTask);

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task object
 *       403:
 *         description: Forbidden (not your task)
 *       404:
 *         description: Task not found
 */
router.get('/:id', tasksController.getTask);

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     summary: Update a task (partial update supported)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [TODO, IN_PROGRESS, DONE] }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Updated task
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.put('/:id', tasksController.updateTask);

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.delete('/:id', tasksController.deleteTask);

export default router;
