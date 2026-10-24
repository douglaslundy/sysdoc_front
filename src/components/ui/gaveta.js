import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Painel lateral à direita (histórico, detalhes). Tela cheia no celular, 480px a partir de `sm`.
 * Mesma camada e véu do Dialogo.
 */
export function Gaveta({ aberto, aoFechar, titulo, subtitulo, className, children }) {
  const popup = useRef(null);
  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={(abrir) => { if (!abrir) aoFechar?.(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="ui-reset fixed inset-0 z-[1400] bg-black/60" />
        <DialogPrimitive.Popup
          ref={popup}
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            aoFechar?.();
          }}
          className={cn(
            'ui-reset ui-raiz fixed inset-y-0 right-0 z-[1401] flex w-full flex-col overflow-y-auto border-l border-border bg-card p-5 font-sans text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)] outline-none sm:w-[480px]',
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-display text-xl leading-tight font-extrabold">{titulo}</DialogPrimitive.Title>
              {subtitulo ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p> : null}
            </div>
            <DialogPrimitive.Close aria-label="Fechar" className="-mt-1 -mr-1 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
