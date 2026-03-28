import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Shorthand constructors
export const BadRequest = (msg: string) => new AppError(msg, 400);
export const Unauthorized = (msg = 'Unauthorized') => new AppError(msg, 401);
export const Forbidden = (msg = 'Forbidden') => new AppError(msg, 403);
export const NotFound = (msg: string) => new AppError(msg, 404);
export const Conflict = (msg: string) => new AppError(msg, 409);

export function errorHandler(
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    // Known operational errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(422).json({
            success: false,
            message: 'Validation failed',
            data: err.issues.map((e) => ({
                field: e.path.map(String).join('.') || '(root)',
                message: e.message,
            })),
        });
        return;
    }

    // Prisma unique constraint violation
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const fields = (err.meta?.['target'] as string[]) ?? [];
            res.status(409).json({
                success: false,
                message: `A record with this ${fields.join(', ')} already exists`,
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Record not found' });
            return;
        }
    }

    // Unknown/unhandled errors
    logger.error('Unhandled error', { err, url: req.url, method: req.method });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
}
