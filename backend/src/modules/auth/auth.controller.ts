import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { BadRequest } from '../../middleware/errorHandler';
import { config } from '../../config/env';
import { RegisterSchema, LoginSchema } from './auth.schema';
import * as authService from './auth.service';

const REFRESH_COOKIE = 'refreshToken';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const input = RegisterSchema.parse(req.body);
    const user = await authService.register(input);
    sendSuccess(res, user, 'Account created successfully', 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const input = LoginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(input);

    // Send refresh token as HttpOnly cookie
    res.cookie(REFRESH_COOKIE, refreshToken, config.refreshTokenCookie);
    sendSuccess(res, { accessToken, user }, 'Login successful');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    // Accept token from cookie or body
    const token: string | undefined =
        (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
        (req.body as { refreshToken?: string })?.refreshToken;

    if (!token) throw BadRequest('Refresh token is required');

    const tokens = await authService.refreshTokens(token);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, config.refreshTokenCookie);
    sendSuccess(res, { accessToken: tokens.accessToken }, 'Tokens refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const token: string | undefined =
        (req.cookies as Record<string, string>)?.[REFRESH_COOKIE] ??
        (req.body as { refreshToken?: string })?.refreshToken;

    if (token) await authService.logout(token);

    res.clearCookie(REFRESH_COOKIE, {
        path: config.refreshTokenCookie.path,
        httpOnly: config.refreshTokenCookie.httpOnly,
        secure: config.refreshTokenCookie.secure,
        sameSite: config.refreshTokenCookie.sameSite,
    });
    sendSuccess(res, null, 'Logged out successfully');
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
    await authService.logoutAll(req.user!.sub);
    res.clearCookie(REFRESH_COOKIE, {
        path: config.refreshTokenCookie.path,
        httpOnly: config.refreshTokenCookie.httpOnly,
        secure: config.refreshTokenCookie.secure,
        sameSite: config.refreshTokenCookie.sameSite,
    });
    sendSuccess(res, null, 'Logged out from all devices');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!.sub);
    sendSuccess(res, user, 'Profile fetched');
});
