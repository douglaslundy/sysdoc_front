import { setCookie } from 'nookies';
import { fetchWithFallback } from '../../../src/lib/backendUrls';

const MAX_AGE = 60 * 60 * 72; // 72h
const COOKIE_OPTS = {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    try {
        const { res: response } = await fetchWithFallback('login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return res.status(response.status).json({ message: data.message || 'Credenciais inválidas.' });
        }

        const data = await response.json();

        // Token stored as httpOnly — JS cannot read via document.cookie
        setCookie({ res }, 'sysvendas.token', data.token, {
            ...COOKIE_OPTS,
            httpOnly: true,
        });

        // Non-sensitive user metadata (profile checks, display)
        setCookie({ res }, 'sysvendas.id', String(data.user.id), COOKIE_OPTS);
        setCookie({ res }, 'sysvendas.username', data.user.name, COOKIE_OPTS);
        setCookie({ res }, 'sysvendas.profile', data.user.profile, COOKIE_OPTS);

        return res.status(200).json({ user: data.user });
    } catch (_) {
        return res.status(503).json({ message: 'Backend indisponível ou URL de API inválida.' });
    }
}
