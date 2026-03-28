import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { config } from '../../config/env';
import { AuthPayload, RefreshPayload } from '../../types';
import { Conflict, Unauthorized, NotFound } from '../../middleware/errorHandler';
import type { RegisterInput, LoginInput } from './auth.schema';

const BCRYPT_ROUNDS = 12;

// ─── Token helpers ─────────────────────────────────────────────────────────────
function signAccessToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
    });
}

function signRefreshToken(payload: Omit<RefreshPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
}

export function verifyAccessToken(token: string): AuthPayload {
    try {
        return jwt.verify(token, config.jwt.accessSecret) as AuthPayload;
    } catch {
        throw Unauthorized('Invalid or expired access token');
    }
}

export function verifyRefreshToken(token: string): RefreshPayload {
    try {
        return jwt.verify(token, config.jwt.refreshSecret) as RefreshPayload;
    } catch {
        throw Unauthorized('Invalid or expired refresh token');
    }
}

// ─── Auth service ──────────────────────────────────────────────────────────────
export async function register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw Conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
        data: { name: input.name, email: input.email, passwordHash },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return user;
}

export async function login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Constant-time response whether or not user exists
    const hash = user?.passwordHash ?? '$2a$12$invalidhashpadding00000000000000000000000000000000000';
    const valid = await bcrypt.compare(input.password, hash);

    if (!user || !valid) throw Unauthorized('Invalid email or password');

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const tokenId = crypto.randomUUID();
    const refreshToken = signRefreshToken({ sub: user.id, tokenId });

    // Persist refresh token (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
    return { accessToken, refreshToken, user: userData };
}

export async function refreshTokens(token: string) {
    const payload = verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
        // Token reuse or expiry — delete all tokens for this user (breach scenario)
        if (stored) await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
        throw Unauthorized('Refresh token is invalid or expired');
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
    });
    if (!user) throw NotFound('User not found');

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const tokenId = crypto.randomUUID();
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } });

    return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw NotFound('User not found');
    return user;
}
