import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { SelectNativo } from './campos';

/** Rodapé de tabela: itens por página + intervalo + anterior/próxima. Quebra linha no celular. */
export function Paginacao({ total, pagina, porPagina, aoMudarPagina, aoMudarPorPagina, opcoes = [10, 25, 50] }) {
  const inicio = total === 0 ? 0 : pagina * porPagina + 1;
  const fim = Math.min(total, (pagina + 1) * porPagina);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-sm text-muted-foreground">
      <label className="flex items-center gap-2">
        Por página
        <SelectNativo aria-label="Itens por página" className="h-8 w-[92px]" value={porPagina} onChange={(e) => aoMudarPorPagina(Number(e.target.value))}>
          {opcoes.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </SelectNativo>
      </label>
      <div className="flex items-center gap-2">
        <span aria-live="polite">{inicio}–{fim} de {total}</span>
        <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={pagina === 0} onClick={() => aoMudarPagina(pagina - 1)}>
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Próxima página" disabled={fim >= total} onClick={() => aoMudarPagina(pagina + 1)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
