import { createContext, useState, useEffect } from "react";
import { parseCookies } from 'nookies';
import { setAuthToken, api } from '../services/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [myPermissions, setMyPermissions] = useState([]);

    // Non-sensitive metadata still in readable cookies (safe — no secrets)
    const { 'sysvendas.username': username } = parseCookies();
    const { 'sysvendas.profile': profile } = parseCookies();
    const { 'sysvendas.id': user } = parseCookies();

    useEffect(() => {
        // Re-hydrate axios with token from httpOnly cookie via BFF
        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(async data => {
                if (data?.token) {
                    setAuthToken(data.token);
                    setIsAuthenticated(true);
                    // Carrega páginas permitidas para o perfil do usuário logado
                    try {
                        const res = await api.get('/auth/my-permissions');
                        setMyPermissions(res.data.paths || []);
                    } catch (_) {}
                }
            })
            .catch(() => {});
    }, []);

    return (
        <AuthContext.Provider value={{ username, profile, isAuthenticated, user, myPermissions, setMyPermissions }}>
            {children}
        </AuthContext.Provider>
    );
}
