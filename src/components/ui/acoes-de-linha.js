import { Pencil, Trash2 } from 'lucide-react';
import { Button } from './button';

/** Editar + excluir de uma linha de tabela. `desativado` bloqueia os dois (sem permissão sobre o registro). */
export function AcoesDeLinha({ aoEditar, aoExcluir, desativado = false, rotuloEditar = 'Editar', rotuloExcluir = 'Excluir', children }) {
  return (
    <div className="flex flex-wrap gap-2">
      {aoEditar ? (
        <Button variant="success" size="icon-sm" title={rotuloEditar} aria-label={rotuloEditar} disabled={desativado} onClick={aoEditar}>
          <Pencil />
        </Button>
      ) : null}
      {aoExcluir ? (
        <Button variant="destructive" size="icon-sm" title={rotuloExcluir} aria-label={rotuloExcluir} disabled={desativado} onClick={aoExcluir}>
          <Trash2 />
        </Button>
      ) : null}
      {children}
    </div>
  );
}
