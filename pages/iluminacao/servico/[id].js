import { useRouter } from 'next/router';
import DetalhePoste from '../../../src/components/iluminacao/DetalhePoste';

export default function PosteServicoDetalhePage() {
    const router = useRouter();
    return <DetalhePoste modo="servico" id={router.query.id} />;
}
