import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthPayload {
    sub: string;      // user id
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface RefreshPayload {
    sub: string;
    tokenId: string;
    iat?: number;
    exp?: number;
}

// Augment Express Request with authenticated user
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}

export interface PaginationQuery {
    page?: string;
    limit?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    meta?: Record<string, unknown>;
}
