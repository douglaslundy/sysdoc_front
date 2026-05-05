import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
    '/login',
    '/consulta-exame',
    '/esqueci-senha',
    '/redefinir-senha',
];

function isPublicPath(pathname) {
    return (
        PUBLIC_PATHS.includes(pathname) ||
        pathname.startsWith('/showqueue')
    );
}

/**
 * Authentication-only middleware.
 * Runs server-side on every full-page request — redirects unauthenticated users
 * to /login before any page component or getServerSideProps executes.
 *
 * Authorization (which pages each profile can access) is enforced by:
 *   - AuthGuard (client component, database-backed via AuthContext.myPermissions)
 *   - Laravel backend (every API call validates auth independently)
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Let Next.js internals, static files, and API routes through
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Public routes — no session required
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // httpOnly cookies are readable server-side; JS in browser cannot access them
    const token = request.cookies.get('sysvendas.token')?.value;
    const userId = request.cookies.get('sysvendas.id')?.value;

    if (!token || !userId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
