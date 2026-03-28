import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
}

const isProd = process.env['NODE_ENV'] === 'production';

/** Comma-separated list, e.g. https://my-app.vercel.app */
const corsOrigins = (process.env['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

export const config = {
    port: parseInt(process.env['PORT'] ?? '4000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    isDev: !isProd,
    corsOrigins,
    db: {
        url: requireEnv('DATABASE_URL'),
    },
    jwt: {
        accessSecret: requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
        accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
        refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
    },
    cookie: {
        secret: process.env['COOKIE_SECRET'] ?? 'cookie_secret',
    },
    /** Cross-site SPA (e.g. Vercel → API host) needs SameSite=None; Secure in production */
    refreshTokenCookie: {
        httpOnly: true as const,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'strict') as 'lax' | 'strict' | 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/' as const,
    },
} as const;
