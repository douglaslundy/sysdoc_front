import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { AuthContext } from '../../contexts/AuthContext';

// Rotas acessíveis a qualquer usuário autenticado
const ALWAYS_ALLOWED = ['/', '/dashboards'];

export default function AuthGuard({ children, requiredProfiles }) {
    const { profile, myPermissions } = useContext(AuthContext);
    const router = useRouter();

    // Rotas públicas internas — sempre liberadas
    if (ALWAYS_ALLOWED.includes(router.pathname)) return children;

    // Sem perfis requeridos definidos — libera (rota sem restrição)
    if (!requiredProfiles || requiredProfiles.length === 0) return children;

    // Admin tem acesso irrestrito a tudo
    if (profile === 'admin') return children;

    // Perfil predefinido com acesso estático (backward compat com MenuItems.js)
    const hasStaticAccess = requiredProfiles.includes(profile);

    // Perfil dinâmico com acesso concedido via banco de dados
    const hasDynamicAccess = myPermissions.includes(router.pathname);

    if (hasStaticAccess || hasDynamicAccess) return children;

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="60vh"
            textAlign="center"
            p={4}
        >
            <FeatherIcon icon="shield-off" width="64" height="64" color="#f44336" />
            <Typography variant="h3" fontWeight="bold" mt={3} color="error">
                Acesso Não Autorizado
            </Typography>
            <Typography color="textSecondary" mt={2} maxWidth={400}>
                Você não tem permissão para acessar esta página.
                Entre em contato com o administrador do sistema se precisar de acesso.
            </Typography>
            <Button
                variant="contained"
                sx={{ mt: 3 }}
                startIcon={<FeatherIcon icon="arrow-left" width="18" height="18" />}
                onClick={() => router.push('/')}
            >
                Voltar ao Dashboard
            </Button>
        </Box>
    );
}
