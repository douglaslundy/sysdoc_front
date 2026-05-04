export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const rawCookie = req.headers.cookie || '';
    const token = rawCookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith('sysvendas.token='))
        ?.split('=')[1];

    if (!token) {
        return res.status(401).json({ message: 'Não autenticado' });
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }

        const data = await response.json();

        // Token returned so client can hydrate axios in-memory (never stored in JS cookie)
        return res.status(200).json({ user: data.user, token });
    } catch (_) {
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}
