import { createContext, useState, useEffect } from "react";
import { parseCookies } from 'nookies';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Non-sensitive metadata still in readable cookies (safe — no secrets)
    const { 'sysvendas.username': username } = parseCookies();
    const { 'sysvendas.profile': profile } = parseCookies();
    const { 'sysvendas.id': user } = parseCookies();

    useEffect(() => {
        // Re-hydrate axios with token from httpOnly cookie via BFF
        // This runs once on mount (page load / refresh)
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.token) {
                    setAuthToken(data.token);
                    setIsAuthenticated(true);
                }
            })
            .catch(() => {});
    }, []);

    return (
        <AuthContext.Provider value={{ username, profile, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    );
}
