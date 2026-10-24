import { Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Input } from './campos';

/** Campo de busca com lupa; ocupa a linha toda no celular. */
export function CampoDeBusca({ className, rotulo, ...props }) {
  return (
    <div className={cn('relative min-w-[200px] flex-1', className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" aria-label={rotulo} autoComplete="off" className="pl-9" {...props} />
    </div>
  );
}
