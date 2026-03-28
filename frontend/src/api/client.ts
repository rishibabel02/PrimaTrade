import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
    // eslint-disable-next-line no-console
    console.error(
        '[PrimaTrade] VITE_API_BASE_URL is missing — Vercel build must define it to your public HTTPS API URL.'
    );
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // send cookies (refresh token)
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: inject access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token!);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (!error.response && import.meta.env.PROD) {
            if (API_BASE_URL.includes('localhost')) {
                error.message =
                    'API URL not set: add VITE_API_BASE_URL on Vercel (your HTTPS API, ending in /api/v1).';
            } else {
                error.message =
                    'Cannot reach API: ensure the backend is up, uses HTTPS, and CORS allows your Vercel URL.';
            }
            return Promise.reject(error);
        }

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
                const newToken = res.data.data.accessToken as string;
                localStorage.setItem('accessToken', newToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                processQueue(null, newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
