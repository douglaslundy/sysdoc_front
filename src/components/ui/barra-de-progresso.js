import { cn } from '../../lib/cn';

const COR = { ok: 'bg-success-strong', alerta: 'bg-primary', perigo: 'bg-danger-strong' };

function faixaDe(percentual) {
  if (percentual >= 100) return 'perigo';
  if (percentual >= 80) return 'alerta';
  return 'ok';
}

/** Barra de uso: >= 100% perigo, >= 80% alerta, senão normal. */
export function BarraDeProgresso({ valor, maximo, rotulo }) {
  const percentual = maximo > 0 ? (valor / maximo) * 100 : 0;
  const faixa = faixaDe(percentual);
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuenow={valor} aria-valuemin={0} aria-valuemax={maximo} data-faixa={faixa} className="h-1.5 w-full overflow-hidden rounded-[3px] bg-border">
      <div className={cn('h-full transition-[width] duration-[400ms] ease-out', COR[faixa])} style={{ width: `${Math.min(percentual, 100)}%` }} />
    </div>
  );
}
