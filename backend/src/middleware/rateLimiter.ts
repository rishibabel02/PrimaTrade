import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

/** Stricter limiter for auth endpoints */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 auth attempts per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
