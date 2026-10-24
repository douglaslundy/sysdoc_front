import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Indicador de carregamento em linha (texto + giro). */
export function Carregando({ children = 'Carregando...', className }) {
  return (
    <div role="status" className={cn('flex items-center gap-3 py-6 text-sm text-muted-foreground', className)}>
      <Loader2 aria-hidden className="size-5 animate-spin" />
      {children}
    </div>
  );
}
