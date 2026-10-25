import { useRouter } from 'next/router';
import DetalhePoste from '../../../src/components/iluminacao/DetalhePoste';

export default function PosteCadastroDetalhePage() {
    const router = useRouter();
    return <DetalhePoste modo="cadastro" id={router.query.id} />;
}
