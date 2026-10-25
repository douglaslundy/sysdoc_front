import { cn } from '../../lib/cn';

/** Bloco cinza pulsante para telas em carregamento. Defina a altura/largura por className. */
export function Esqueleto({ className }) {
  return <div aria-hidden data-testid="esqueleto" className={cn('animate-[pulse-suave_1.5s_ease-in-out_infinite] rounded-xl bg-border', className)} />;
}
