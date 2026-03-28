import { isAxiosError } from 'axios';

/** Extract a user-facing message from API / network errors */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
    if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string; data?: { message?: string }[] } | undefined;
        if (data?.message) return data.message;
        if (Array.isArray(data?.data) && data.data[0]?.message) {
            return data.data.map((e) => e.message).join('; ');
        }
        if (err.message) return err.message;
    }
    if (err instanceof Error) return err.message;
    return fallback;
}
