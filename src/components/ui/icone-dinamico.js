import { DynamicIcon } from 'lucide-react/dynamic';
import { cn } from '../../lib/cn';

/**
 * Ícone escolhido por nome (kebab-case do lucide), usado onde o nome vem do banco
 * (menu, páginas e categorias do sistema). Nome desconhecido ou carregando = espaço vazio do mesmo tamanho.
 */
export function IconeDinamico({ nome, className }) {
  const vazio = <span aria-hidden className={cn('inline-block size-4 shrink-0', className)} />;
  return <DynamicIcon name={nome} aria-hidden className={cn('size-4 shrink-0', className)} fallback={() => vazio} />;
}
