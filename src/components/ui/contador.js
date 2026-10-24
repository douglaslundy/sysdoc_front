import { cn } from '../../lib/cn';

/** Bolinha de contagem sobre um ícone; some quando o valor é 0. */
export function Contador({ valor, max = 99, tom = 'perigo', className }) {
  const n = Number(valor) || 0;
  if (n <= 0) return null;
  return (
    <span
      aria-label={`${n} pendentes`}
      className={cn(
        'absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-bold',
        tom === 'perigo' ? 'bg-danger-strong text-white' : 'bg-primary text-primary-foreground',
        className,
      )}
    >
      {n > max ? `${max}+` : n}
    </span>
  );
}
