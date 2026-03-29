import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/env';
import { logger } from './config/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/tasks/tasks.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// ─── Security & Parsing ──────────────────────────────────────────────────────
app.use(helmet());
const devOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(
    cors({
        credentials: true,
        origin(origin, callback) {
            if (!origin) {
                callback(null, true);
                return;
            }
            if (config.isDev) {
                callback(null, devOrigins.includes(origin));
                return;
            }
            if (config.corsOrigins.length === 0) {
                callback(null, false);
                return;
            }
            callback(null, config.corsOrigins.includes(origin));
        },
    })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.cookie.secret));
app.use(globalRateLimiter);

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(
    morgan(config.isDev ? 'dev' : 'combined', {
        stream: { write: (msg) => logger.http(msg.trim()) },
    })
);

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerSpec = swaggerJsdoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PrimaTrade API',
            version: '1.0.0',
            description:
                'Scalable REST API with JWT Authentication and Role-Based Access Control. Built for the PrimaTrade Backend Developer Intern assignment.',
            contact: { name: 'API Support', email: 'hello@primetrade.ai' },
        },
        servers: [{ url: `http://localhost:${config.port}/api/v1`, description: 'Development server' }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ApiError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                        data: { type: 'array', items: { type: 'object' } },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.routes.js'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PrimaTrade API Docs',
}));

// Serve raw swagger JSON for tooling
app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'PrimaTrade API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
