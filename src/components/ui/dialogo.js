import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Modal do CRM: véu bg-black/60, caixa bg-card rounded-xl, cabeçalho com X, rodapé à direita.
 * `bloqueante` impede fechar por clique fora/Esc (avisos que precisam ser lidos).
 * z-index acima do Modal do MUI (1300) enquanto houver telas legadas; `elevado` fica na frente de tudo.
 * Largura: nunca passa da tela (celular); altura rola dentro da caixa.
 */
// Diálogos abertos, do mais antigo ao mais novo.
const pilha = [];

export function Dialogo({ aberto, aoFechar, bloqueante = false, tamanho = 'md', alerta = false, elevado = false, className, children, ...props }) {
  const popup = useRef(null);
  const token = useRef({});
  useEffect(() => {
    if (!aberto) return undefined;
    const meu = token.current;
    pilha.push(meu);
    return () => {
      pilha.splice(pilha.indexOf(meu), 1);
    };
  }, [aberto]);
  const largura = { sm: 'max-w-sm', md: 'max-w-[560px]', lg: 'max-w-[760px]', xl: 'max-w-[1100px]' }[tamanho] || 'max-w-[560px]';
  return (
    <DialogPrimitive.Root
      open={aberto}
      onOpenChange={(abrir, detalhes) => {
        if (abrir) return;
        if (bloqueante && detalhes?.reason !== 'close-press') return;
        // Esc e clique fora valem só para o diálogo de cima (aviso/confirmação aberto sobre outro não fecha o de baixo).
        if (detalhes?.reason !== 'close-press' && pilha[pilha.length - 1] !== token.current) return;
        aoFechar?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className={cn('ui-reset fixed inset-0 bg-black/60', elevado ? 'z-[1600]' : 'z-[1400]')} />
        <DialogPrimitive.Popup
          ref={popup}
          // Foco inicial no primeiro campo (não no X); sem campo, o padrão do base-ui.
          initialFocus={() => popup.current?.querySelector('input:not([type=hidden]), select, textarea') || true}
          role={alerta ? 'alertdialog' : 'dialog'}
          // O Esc não pode vazar pela árvore React para um Modal do MUI que contenha este diálogo (fecharia os dois).
          onKeyDown={(e) => {
            if (e.key !== 'Escape') return;
            e.stopPropagation();
            if (!bloqueante) aoFechar?.();
          }}
          className={cn(
            elevado ? 'z-[1601]' : 'z-[1401]',
            'ui-reset ui-raiz fixed left-1/2 top-1/2 flex max-h-[calc(100dvh-24px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border border-border bg-card p-5 font-sans text-card-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)] outline-none sm:p-7',
            largura,
            className,
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function DialogoTitulo({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('font-display text-xl font-extrabold leading-tight', className)} {...props} />;
}

export function DialogoCabecalho({ children, comFechar = true, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <DialogoTitulo>{children}</DialogoTitulo>
      {comFechar ? (
        <DialogPrimitive.Close aria-label="Fechar" className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25">
          <X className="size-5" />
        </DialogPrimitive.Close>
      ) : null}
    </div>
  );
}

export function DialogoDescricao({ className, ...props }) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function DialogoRodape({ className, ...props }) {
  return <div className={cn('mt-5 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end', className)} {...props} />;
}
