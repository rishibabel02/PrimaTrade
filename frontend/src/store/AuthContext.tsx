import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, User } from '../api/auth';
import toast from 'react-hot-toast';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: try to restore session from stored token
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setIsLoading(false);
            return;
        }
        authApi
            .me()
            .then((res) => setUser(res.data.data))
            .catch(() => localStorage.removeItem('accessToken'))
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login({ email, password });
        const { accessToken, user } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(user);
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        await authApi.register({ name, email, password });
        // Auto-login after registration
        await (async () => {
            const res = await authApi.login({ email, password });
            const { accessToken, user } = res.data.data;
            localStorage.setItem('accessToken', accessToken);
            setUser(user);
        })();
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            // best effort
        }
        localStorage.removeItem('accessToken');
        setUser(null);
        toast.success('Logged out successfully');
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
