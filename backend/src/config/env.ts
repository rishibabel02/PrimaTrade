import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
    return value;
}

export const config = {
    port: parseInt(process.env['PORT'] ?? '4000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    isDev: process.env['NODE_ENV'] !== 'production',
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
} as const;
