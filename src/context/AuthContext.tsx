import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
    token: string | null;
    role: string | null;
    playerId: string | null;
    login: (token: string, role: string) => void;
    logout: () => void;
    isOwner: boolean;
    isPlayer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractPlayerIdFromToken(token: string): string | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.playerId || null;
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
    const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem('playerId'));

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            if (role) localStorage.setItem('role', role);
            if (playerId) localStorage.setItem('playerId', playerId);
            else localStorage.removeItem('playerId');
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('playerId');
        }
    }, [token, role, playerId]);

    const login = (newToken: string, newRole: string) => {
        setToken(newToken);
        setRole(newRole);
        setPlayerId(extractPlayerIdFromToken(newToken));
    };

    const logout = () => {
        setToken(null);
        setRole(null);
        setPlayerId(null);
    };

    const isOwner = role === 'owner';
    const isPlayer = role === 'player';

    return (
        <AuthContext.Provider value={{ token, role, playerId, login, logout, isOwner, isPlayer }}>
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
