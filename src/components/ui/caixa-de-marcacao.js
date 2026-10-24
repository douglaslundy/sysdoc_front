import { cn } from '../../lib/cn';

/** Checkbox nativo com a cor do tema (acessível por teclado e leitor de tela). `children` vira o rótulo clicável. */
export function CaixaDeMarcacao({ id, marcado, aoMudar, disabled, children, className, ...props }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-center gap-2 text-sm text-foreground', disabled && 'cursor-not-allowed opacity-60', className)}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(marcado)}
        disabled={disabled}
        onChange={(e) => aoMudar?.(e.target.checked, e)}
        className="size-4 shrink-0 cursor-[inherit] rounded border border-input accent-[var(--primary)] outline-none focus-visible:ring-[3px] focus-visible:ring-primary/25"
        {...props}
      />
      {children}
    </label>
  );
}
