import { parseCookies } from 'nookies';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método não permitido' });
    }

    const cookies = parseCookies({ req });
    const token = cookies['sysvendas.token'];

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

        return res.status(200).json({ user: data.user, token });
    } catch (_) {
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
}
