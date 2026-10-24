import { Input as InputPrimitive } from '@base-ui/react/input';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Visual único dos campos de formulário (Input, select e textarea). */
export const CLASSE_CAMPO =
  'w-full min-w-0 rounded-lg border border-input bg-background px-3 py-[9px] text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60 read-only:opacity-80 aria-invalid:border-danger aria-invalid:ring-[3px] aria-invalid:ring-danger/20';

export function Input({ className, type, ...props }) {
  return <InputPrimitive type={type} data-slot="input" className={cn(CLASSE_CAMPO, 'h-[37px] py-0', className)} {...props} />;
}

/** <select> nativo: acessível e leve; a seta é um ícone próprio. */
export function SelectNativo({ className, children, ...props }) {
  return (
    <div className="relative">
      <select className={cn(CLASSE_CAMPO, 'h-[37px] appearance-none py-0 pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown data-testid="seta-select" aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function TextareaNativo({ className, ...props }) {
  return <textarea className={cn(CLASSE_CAMPO, 'min-h-[80px]', className)} {...props} />;
}

export function Label({ className, ...props }) {
  return <label data-slot="label" className={cn('flex items-center text-[13px] leading-none font-normal text-muted-foreground select-none', className)} {...props} />;
}

/** Label + controle + dica + erro, com o erro ligado ao controle por aria-describedby. */
export function Campo({ id, label, erro, dica, obrigatorio, children }) {
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  const descritores = [dica ? idDica : null, erro ? idErro : null].filter(Boolean).join(' ');
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label}
        {obrigatorio ? (
          <>
            <span aria-hidden className="ml-0.5 text-danger">*</span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        ) : null}
      </Label>
      {children({ id, 'aria-invalid': Boolean(erro), 'aria-describedby': descritores || undefined })}
      {dica ? <p id={idDica} className="text-[11px] text-muted-foreground">{dica}</p> : null}
      {erro ? <p id={idErro} className="text-xs text-danger">{erro}</p> : null}
    </div>
  );
}
