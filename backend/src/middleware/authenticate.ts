import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.service';
import { Role } from '@prisma/client';
import { Unauthorized, Forbidden } from './errorHandler';

/**
 * Middleware: validates Bearer token and attaches user to req.user
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw Unauthorized('No access token provided');

    const token = authHeader.slice(7);
    req.user = verifyAccessToken(token);
    next();
}

/**
 * Middleware factory: restricts route to specific roles
 */
export function authorize(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user) throw Unauthorized();
        if (!roles.includes(req.user.role)) {
            throw Forbidden('You do not have permission to perform this action');
        }
        next();
    };
}
