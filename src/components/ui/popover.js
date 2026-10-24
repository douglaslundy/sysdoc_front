import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '../../lib/cn';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverFechar = PopoverPrimitive.Close;

/** Painel flutuante: nunca passa da largura da tela (celular) e rola se for alto. */
export function PopoverConteudo({ className, align = 'end', sideOffset = 8, children, ...props }) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} sideOffset={sideOffset} collisionPadding={8} className="z-[200]">
        <PopoverPrimitive.Popup
          className={cn(
            'max-h-[calc(100dvh-80px)] w-[min(420px,calc(100vw-16px))] overflow-y-auto rounded-xl border border-border bg-popover text-sm text-popover-foreground shadow-[0_4px_20px_rgba(0,0,0,0.35)] outline-none',
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}
