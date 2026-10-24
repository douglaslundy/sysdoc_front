import { cn } from '../../lib/cn';

/** Par rótulo/valor para telas de detalhe. O valor quebra palavras longas. */
export function Dado({ rotulo, children, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-xs font-semibold text-muted-foreground">{rotulo}</p>
      <p className="text-sm break-words">{children}</p>
    </div>
  );
}
