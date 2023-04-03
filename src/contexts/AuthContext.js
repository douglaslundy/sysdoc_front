import { createContext, useState } from "react";
import { parseCookies } from 'nookies';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const { 'sysvendas.username': username } = parseCookies();
    const { 'sysvendas.profile': profile } = parseCookies();
    const { 'sysvendas.id': user } = parseCookies();

    const { 'sysvendas.token': tokens } = parseCookies();

    return (
        <AuthContext.Provider value={{ username, profile, isAuthenticated, tokens, user }}>
            {children}
        </AuthContext.Provider>
    )
}
