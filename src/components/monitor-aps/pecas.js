import { Card, CardContent } from '../ui/card';

/**
 * Cartão de indicador do Monitor APS: título, valor colorido e um ícone em círculo.
 * `cor` vem do dado (classificação/situação), por isso entra como estilo; `Icone` é um componente lucide.
 */
export function MetricaAps({ Icone, titulo, valor, sub, cor }) {
  return (
    <Card size="sm" className="h-full">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted-foreground">{titulo}</p>
          <p className="mt-1 font-mono text-3xl font-bold" style={{ color: cor }}>{valor ?? '—'}</p>
          {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${cor}22`, color: cor }}>
          <Icone className="size-6" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

/** Selo colorido por dado (classificação); texto sempre presente, a cor só reforça. */
export function SeloAps({ cor, children }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: `${cor}22`, color: cor }}
    >
      {children}
    </span>
  );
}
