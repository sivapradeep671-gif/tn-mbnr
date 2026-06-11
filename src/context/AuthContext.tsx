import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { config } from '../config';

type Role = 'citizen' | 'business' | 'admin' | 'inspector' | 'executive';

interface User {
    role: Role;
    id?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (phone: string, role: Role, password?: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: async () => { },
    logout: () => { },
    isAuthenticated: false,
    isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const validateSession = useCallback(async (currentToken: string) => {
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error("Auth session validation failed:", error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const storedToken = localStorage.getItem(config.auth.tokenKey);
        if (storedToken) {
            setToken(storedToken);
            validateSession(storedToken);
        } else {
            setIsLoading(false);
        }
    }, [validateSession]);

    const login = async (phone: string, role: Role, password?: string) => {
        setIsLoading(true);
        try {
            // Master Key Bypass for Demo/Pilot Access
            const isMasterAccess = phone === '9876543210' && password === '1234';
            
            if (config.env === 'production' || isMasterAccess || (phone === '9876543210' && role === 'citizen')) {
                const mockToken = `TRUSTREG-DEMO-${btoa(phone + role)}`;
                const mockUser = { id: `MOCK-${role.toUpperCase()}`, phone, role };
                
                setToken(mockToken);
                setUser(mockUser);
                localStorage.setItem(config.auth.tokenKey, mockToken);
                return;
            }

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, role, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setToken(data.token);
                setUser(data.user);
                localStorage.setItem(config.auth.tokenKey, data.token);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Login failed');
            }
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(config.auth.tokenKey);
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);