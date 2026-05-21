import { createContext, useState, useEffect, useCallback } from "react";
import { parseCookies, destroyCookie } from 'nookies';
import Router from 'next/router';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext({});

const PUBLIC_PATHS = ['/login', '/consulta-exame', '/esqueci-senha', '/redefinir-senha', '/attendance/panel', '/transparency/medicines', '/transparency/medicines-panel', '/transparency/medicines-monthly-acquisitions'];

function isPublicPath(pathname) {
    return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/showqueue');
}

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [myPermissions, setMyPermissions] = useState([]);
    // Starts false; flips to true once the BFF responds (success or failure).
    // AuthGuard waits for this before rendering any access decision.
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);

    // Non-sensitive metadata stored in readable cookies (no secrets here)
    const { 'sysvendas.username': username } = parseCookies();
    const { 'sysvendas.profile': profile } = parseCookies();
    const { 'sysvendas.id': user } = parseCookies();

    const loadAuth = useCallback(() => {
        // Single BFF call that validates the httpOnly token and returns permissions together.
        // Also handles session expiry: 401 means the token is gone/expired — clear metadata
        // cookies so _app.js can redirect to login on next route event.
        fetch('/api/auth/me')
            .then(res => {
                if (res.status === 401 && !isPublicPath(Router.pathname)) {
                    destroyCookie(null, 'sysvendas.id',       { path: '/' });
                    destroyCookie(null, 'sysvendas.username',  { path: '/' });
                    destroyCookie(null, 'sysvendas.profile',   { path: '/' });
                    Router.push('/login');
                }
                return res.ok ? res.json() : null;
            })
            .then(data => {
                if (data?.token) {
                    setAuthToken(data.token);
                    setIsAuthenticated(true);
                    setMyPermissions(data.permissions || []);
                }
            })
            .catch(() => {})
            .finally(() => {
                setPermissionsLoaded(true);
            });
    }, []);

    useEffect(() => {
        loadAuth();
    }, [loadAuth]);

    return (
        <AuthContext.Provider
            value={{
                username,
                profile,
                isAuthenticated,
                user,
                myPermissions,
                setMyPermissions,
                permissionsLoaded,
                loadAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
