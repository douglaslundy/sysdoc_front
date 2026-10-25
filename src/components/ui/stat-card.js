import Link from 'next/link';
import { cn } from '../../lib/cn';

const FILETE = {
  primario: 'border-t-primary',
  sucesso: 'border-t-success-strong',
  perigo: 'border-t-danger-strong',
  info: 'border-t-info-strong',
};

/** KPI. tom: primario|sucesso|perigo|info. Com href vira link. */
export function StatCard({ titulo, valor, legenda, tom = 'primario', href, Icone }) {
  const corpo = (
    <>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
        {Icone ? <Icone aria-hidden className="size-[18px] shrink-0" /> : null}
        {titulo}
      </p>
      <p className="mt-1 font-mono text-[26px] leading-tight font-bold">{valor}</p>
      {legenda ? <p className="mt-1 text-xs text-muted-foreground">{legenda}</p> : null}
    </>
  );
  const classe = cn('block rounded-xl border border-t-2 border-border bg-card p-4', FILETE[tom], href && 'transition-colors hover:bg-hover focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none');
  return href ? (
    <Link href={href}>
      <a className={classe}>{corpo}</a>
    </Link>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}
