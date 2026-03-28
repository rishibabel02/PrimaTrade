import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: Record<string, unknown>
): void {
    const response: ApiResponse<T> = { success: true, message, data };
    if (meta) response.meta = meta;
    res.status(statusCode).json(response);
}

export function sendError(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown
): void {
    const response: ApiResponse = { success: false, message };
    if (errors !== undefined) response.data = errors;
    res.status(statusCode).json(response);
}
