import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { AuthContext } from '../../contexts/AuthContext';

// Rotas que sempre são acessíveis a qualquer usuário autenticado
const ALWAYS_ALLOWED = ['/', '/dashboards'];

export default function AuthGuard({ children, requiredProfiles }) {
    const { profile } = useContext(AuthContext);
    const router = useRouter();

    if (!requiredProfiles || requiredProfiles.length === 0) {
        return children;
    }

    if (ALWAYS_ALLOWED.includes(router.pathname)) {
        return children;
    }

    if (!profile || !requiredProfiles.includes(profile)) {
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

    return children;
}
