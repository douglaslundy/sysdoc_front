import { destroyCookie } from 'nookies';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const rawCookie = req.headers.cookie || '';
    const token = rawCookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('sysvendas.token='))
        ?.split('=')[1];

    if (token) {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
        } catch (_) {}
    }

    const ctx = { res };
    destroyCookie(ctx, 'sysvendas.token', { path: '/' });
    destroyCookie(ctx, 'sysvendas.id', { path: '/' });
    destroyCookie(ctx, 'sysvendas.username', { path: '/' });
    destroyCookie(ctx, 'sysvendas.profile', { path: '/' });

    return res.status(200).json({ message: 'Logout realizado com sucesso' });
}
