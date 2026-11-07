import dynamic from 'next/dynamic';
import { cn } from '../../lib/cn';

// lucide-react/dynamic é só ESM e o Next 12 externaliza node_modules no servidor: importar no SSR derruba
// /login, /esqueci-senha etc. Por isso carrega apenas no cliente (ssr:false) e no servidor renderiza o espaço vazio.
const DynamicIcon = dynamic(() => import('lucide-react/dynamic').then((m) => m.DynamicIcon), { ssr: false });

/**
 * Ícone escolhido por nome (kebab-case do lucide), usado onde o nome vem do banco
 * (menu, páginas e categorias do sistema). Nome desconhecido ou carregando = espaço vazio do mesmo tamanho.
 */
export function IconeDinamico({ nome, className }) {
  const vazio = <span aria-hidden className={cn('inline-block size-4 shrink-0', className)} />;
  return <DynamicIcon name={nome} aria-hidden className={cn('size-4 shrink-0', className)} fallback={() => vazio} />;
}
