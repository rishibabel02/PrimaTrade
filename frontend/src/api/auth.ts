import api from './client';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
}

export interface LoginResponse {
    accessToken: string;
    user: User;
}

export const authApi = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post<{ success: boolean; data: User }>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data),

    logout: () => api.post('/auth/logout'),

    refresh: () =>
        api.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh'),

    me: () => api.get<{ success: boolean; data: User }>('/auth/me'),
};
