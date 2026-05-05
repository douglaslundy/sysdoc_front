import { createContext, useState, useEffect } from "react";
import { parseCookies } from 'nookies';
import { setAuthToken } from '../services/api';

export const AuthContext = createContext({});

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

    useEffect(() => {
        // Single BFF call that validates the httpOnly token and returns permissions together
        fetch('/api/auth/me')
            .then(res => (res.ok ? res.json() : null))
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
