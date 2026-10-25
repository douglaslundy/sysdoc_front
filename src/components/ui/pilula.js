import { cn } from '../../lib/cn';

const SOLIDA = {
  sucesso: 'bg-success-strong text-white',
  perigo: 'bg-danger-strong text-white',
  info: 'bg-info-strong text-white',
  alerta: 'bg-primary text-primary-foreground',
  neutro: 'bg-muted-strong text-white',
};

const CONTORNO = {
  sucesso: 'border-success text-success',
  perigo: 'border-danger text-danger',
  info: 'border-info text-info',
  alerta: 'border-primary text-primary-text',
  neutro: 'border-muted-strong text-muted-foreground',
};

/** Status em texto colorido: a cor nunca é a única informação. tom: sucesso|perigo|info|alerta|neutro. */
export function Pilula({ tom, contorno = false, children }) {
  return (
    <span
      data-tom={tom}
      data-contorno={contorno ? 'true' : undefined}
      className={cn(
        'inline-flex items-center rounded-full whitespace-nowrap px-[11px] py-[3px] font-display text-[11px] font-bold tracking-[0.04em] uppercase',
        contorno ? cn('border-[1.5px] bg-transparent', CONTORNO[tom]) : SOLIDA[tom],
      )}
    >
      {children}
    </span>
  );
}

const TOM_DA_COR = { success: 'sucesso', error: 'perigo', warning: 'alerta', info: 'info', primary: 'alerta', secondary: 'neutro', default: 'neutro' };

/** Traduz a `color` do Chip do MUI para o `tom` da Pilula (telas migradas). */
export const tomDaCor = (cor) => TOM_DA_COR[cor] || 'neutro';
