import { Request } from 'express';

/** Express 5 may type params as `string | string[]` */
export function routeParam(req: Request, name: string): string | undefined {
    const v = req.params[name];
    if (v === undefined) return undefined;
    return Array.isArray(v) ? v[0] : v;
}
