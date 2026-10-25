import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Carregando } from '../ui/carregando';
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
        return <Carregando className="min-h-[60vh] justify-center">Carregando permissões...</Carregando>;
    }

    if (ALWAYS_ALLOWED.includes(router.pathname)) return children;

    if (profile === ADMIN_SLUG) return children;

    // Caminho real da URL (ex: /protocolo/novo), sem query/hash. Necessario
    // porque em rotas catch-all o router.pathname vem como template
    // (/protocolo/[...slug]) e nunca casa com uma pagina especifica concedida.
    const realPath = (router.asPath || router.pathname).split(/[?#]/)[0] || router.pathname;

    const isAllowed = (path) =>
        myPermissions.includes(path) ||
        // Sub-rotas herdam do menu pai. O sufixo '/' evita que /dashboard
        // libere /dashboards.
        myPermissions.some(allowed => path.startsWith(allowed + '/'));

    if (isAllowed(realPath) || isAllowed(router.pathname)) return children;

    // Rota catch-all (/protocolo/[...slug], /almoxarifado/[[...x]]): basta ter
    // acesso a QUALQUER pagina da secao para carregar a pagina catch-all — os
    // controles finos ficam dentro do proprio componente.
    const catchAll = router.pathname.match(/^(.+?)\/\[\[?\.\.\./);
    if (catchAll) {
        const base = catchAll[1];
        const hasSectionAccess = myPermissions.some(
            allowed => allowed === base || allowed.startsWith(base + '/')
        );
        if (hasSectionAccess) return children;
    }

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
            <ShieldOff className="size-16 text-danger" aria-hidden />
            <h1 className="mt-6 font-display text-3xl font-extrabold text-danger">Acesso Não Autorizado</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
                Você não tem permissão para acessar esta página.
                Entre em contato com o administrador do sistema se precisar de acesso.
            </p>
            <Button className="mt-6" onClick={() => router.push('/')}>
                <ArrowLeft /> Voltar ao Dashboard
            </Button>
        </div>
    );
}
