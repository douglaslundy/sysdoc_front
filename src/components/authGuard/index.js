import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import { AuthContext } from '../../contexts/AuthContext';

// Routes accessible to every authenticated user regardless of profile permissions
const ALWAYS_ALLOWED = ['/'];

// Admin profile slug — bypass is intentional and documented here as the single location
const ADMIN_SLUG = 'admin';

/**
 * Single source of authorization for all protected pages.
 *
 * Access rules (in order):
 *   1. permissionsLoaded = false   → show spinner (never flash content or deny prematurely)
 *   2. ALWAYS_ALLOWED path         → allow (authenticated users, no permission required)
 *   3. profile === ADMIN_SLUG      → allow (admin bypass, only here — not duplicated elsewhere)
 *   4. exact match in myPermissions → allow
 *   5. prefix match in myPermissions → allow sub-routes (e.g. /laboratorio/exames/novo
 *      is allowed when /laboratorio/exames is in permissions)
 *   6. default                     → deny (deny-by-default)
 *
 * Note on router.pathname: Next.js Pages Router returns the file-system template
 * (e.g. /laboratorio/exames/[id]/campos), not the actual URL. Prefix matching
 * works correctly because the template still shares the parent path prefix.
 *
 * Props: none — AuthGuard reads the current pathname from useRouter internally.
 * The requiredProfiles prop was removed; all authorization comes from the database.
 */
export default function AuthGuard({ children }) {
    const { profile, myPermissions, permissionsLoaded } = useContext(AuthContext);
    const router = useRouter();

    if (!permissionsLoaded) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (ALWAYS_ALLOWED.includes(router.pathname)) return children;

    if (profile === ADMIN_SLUG) return children;

    // Exact match (top-level menu pages)
    if (myPermissions.includes(router.pathname)) return children;

    // Prefix match: sub-routes inherit from their parent menu page.
    // The '/' suffix prevents /dashboard from granting access to /dashboards.
    const hasParentPermission = myPermissions.some(
        allowed => router.pathname.startsWith(allowed + '/')
    );
    if (hasParentPermission) return children;

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
