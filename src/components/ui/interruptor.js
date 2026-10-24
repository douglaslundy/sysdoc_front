import { Switch } from '@base-ui/react/switch';
import { cn } from '../../lib/cn';

/** Liga/desliga com rótulo clicável. */
export function Interruptor({ id, marcado, aoMudar, children, className }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-center gap-3 text-sm text-foreground', className)}>
      <Switch.Root
        id={id}
        checked={Boolean(marcado)}
        onCheckedChange={aoMudar}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border bg-muted outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/25 data-[checked]:border-primary data-[checked]:bg-primary"
      >
        <Switch.Thumb className="block size-4 translate-x-0.5 rounded-full bg-foreground transition-transform data-[checked]:translate-x-[18px] data-[checked]:bg-primary-foreground" />
      </Switch.Root>
      {children}
    </label>
  );
}
