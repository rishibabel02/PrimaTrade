import { config } from './config/env';
import { connectDB, disconnectDB } from './config/database';
import { logger } from './config/logger';
import app from './app';

async function main() {
    await connectDB();

    const server = app.listen(config.port, () => {
        logger.info(`🚀 PrimaTrade API running on http://localhost:${config.port}`);
        logger.info(`📚 Swagger docs available at http://localhost:${config.port}/api/docs`);
        logger.info(`🌍 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);
        server.close(async () => {
            await disconnectDB();
            logger.info('Server closed');
            process.exit(0);
        });
        // Force exit after 10s
        setTimeout(() => process.exit(1), 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled promise rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught exception', { error });
        process.exit(1);
    });
}

main().catch((err) => {
    logger.error('Failed to start server', { err });
    process.exit(1);
});
