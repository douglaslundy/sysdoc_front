import ConformidadeCidadao from '../src/components/conformidadeCidadao';
import AuthGuard from '../src/components/authGuard';

export default function ConformidadeCidadaoPage() {
    return (
        <AuthGuard>
            <ConformidadeCidadao />
        </AuthGuard>
    );
}
