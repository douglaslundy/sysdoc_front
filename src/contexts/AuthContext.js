import { createContext, useEffect, useState } from "react";
import { parseCookies } from 'nookies';
import axios from "axios";

export const AuthContext = createContext({});


export function AuthProvider({ children }) {

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const { 'sysvendas.username': username } = parseCookies();
    const { 'sysvendas.profile': profile } = parseCookies();

    const { 'sysvendas.token': tokens } = parseCookies();

    return (
        <AuthContext.Provider value={{ username, profile, isAuthenticated, tokens }}>
            {children}
        </AuthContext.Provider>
    )
}
