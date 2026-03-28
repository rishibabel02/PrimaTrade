import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { BadRequest } from '../../middleware/errorHandler';
import { routeParam } from '../../utils/routeParams';
import { prisma } from '../../config/database';
import { z } from 'zod';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('ADMIN'));

const UserQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().optional(),
});

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Forbidden – admin only
 */
router.get(
    '/users',
    asyncHandler(async (req, res) => {
        const { page, limit, search } = UserQuerySchema.parse(req.query);
        const skip = (page - 1) * limit;

        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    _count: { select: { tasks: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        sendSuccess(res, users, 'Users fetched', 200, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    })
);

/**
 * @openapi
 * /admin/users/{id}/promote:
 *   patch:
 *     summary: Promote user to admin role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User promoted
 *       404:
 *         description: User not found
 */
router.patch(
    '/users/:id/promote',
    asyncHandler(async (req, res) => {
        const userId = routeParam(req, 'id');
        if (!userId) throw BadRequest('User id is required');
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADMIN' },
            select: { id: true, name: true, email: true, role: true },
        });
        sendSuccess(res, user, 'User promoted to admin');
    })
);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Get platform statistics (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Platform stats
 */
router.get(
    '/stats',
    asyncHandler(async (_req, res) => {
        const [totalUsers, totalTasks, tasksByStatus] = await Promise.all([
            prisma.user.count(),
            prisma.task.count(),
            prisma.task.groupBy({ by: ['status'], _count: { status: true } }),
        ]);

        const stats = {
            totalUsers,
            totalTasks,
            tasksByStatus: tasksByStatus.reduce(
                (acc, g) => ({ ...acc, [g.status]: g._count.status }),
                {} as Record<string, number>
            ),
        };

        sendSuccess(res, stats, 'Stats fetched');
    })
);

export default router;
