import { parseCookies } from 'nookies';
import { fetchWithFallback } from '../../../src/lib/backendUrls';

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
        // Validate session and load profile permissions in a single round-trip pair
        const [validateRes, permissionsRes] = await Promise.all([
            fetchWithFallback('validate', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }).then(({ res }) => res),
            fetchWithFallback('auth/my-permissions', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            }).then(({ res }) => res),
        ]);

        if (!validateRes.ok) {
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }

        const validateData = await validateRes.json();
        const permissionsData = permissionsRes.ok
            ? await permissionsRes.json()
            : { paths: [] };

        return res.status(200).json({
            user: validateData.user,
            token,
            permissions: permissionsData.paths || [],
        });
    } catch (_) {
        return res.status(503).json({ message: 'Backend indisponível ou URL de API inválida.' });
    }
}
