import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
    '/login',
    '/consulta-exame',
    '/esqueci-senha',
    '/redefinir-senha',
    '/transparency/medicines',
    '/transparency/medicines-panel',
    '/transparency/medicines-monthly-acquisitions',
];

function isPublicPath(pathname) {
    return (
        PUBLIC_PATHS.includes(pathname) ||
        pathname.startsWith('/showqueue')
    );
}

// request.cookies.get() in Next.js 12 Edge Runtime does not correctly parse
// cookie names that contain dots (e.g. "sysvendas.id"). Parsing the raw
// Cookie header avoids the issue entirely.
function getRawCookieValue(cookieHeader, name) {
    for (const part of cookieHeader.split(';')) {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) continue;
        const key = part.slice(0, eqIdx).trim();
        if (key === name) {
            const val = part.slice(eqIdx + 1).trim();
            return val || null;
        }
    }
    return null;
}

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

    const cookieHeader = request.headers.get('cookie') ?? '';
    const userId = getRawCookieValue(cookieHeader, 'sysvendas.id');

    if (!userId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
