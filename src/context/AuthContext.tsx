import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    role: string | null;
    login: (token: string, role: string) => void;
    logout: () => void;
    isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            if (role) localStorage.setItem('role', role);
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
        }
    }, [token, role]);

    const login = (newToken: string, newRole: string) => {
        setToken(newToken);
        setRole(newRole);
    };

    const logout = () => {
        setToken(null);
        setRole(null);
    };

    const isOwner = role === 'owner';

    return (
        <AuthContext.Provider value={{ token, role, login, logout, isOwner }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
