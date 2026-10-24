import { cn } from '../../lib/cn';

const LINHAS_DE_ESQUELETO = 5;

/**
 * Tabela em cartão. colunas: [{ chave, titulo, render(linha), numerica? }].
 * Com aoAbrir a linha vira clicável (Enter/Espaço também).
 */
export function DataTable({ rotulo, colunas, linhas, chaveDaLinha, carregando = false, vazio = 'Nada por aqui ainda.', aoAbrir }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table aria-label={rotulo} aria-busy={carregando} className="w-full border-collapse text-left">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} scope="col" className="border-b border-border px-4 py-2.5 text-xs font-semibold tracking-[0.05em] whitespace-nowrap text-muted-foreground uppercase">
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {carregando ? (
            Array.from({ length: LINHAS_DE_ESQUELETO }, (_, i) => (
              <tr key={i} data-testid="linha-esqueleto">
                {colunas.map((c) => (
                  <td key={c.chave} className="border-b border-border px-4 py-3">
                    <div className="h-3.5 w-[70%] animate-[pulse-suave_1.5s_ease-in-out_infinite] rounded bg-border" />
                  </td>
                ))}
              </tr>
            ))
          ) : linhas.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className="px-4 py-10 text-center text-sm text-muted-foreground">{vazio}</td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr
                key={chaveDaLinha(linha)}
                tabIndex={aoAbrir ? 0 : undefined}
                onClick={aoAbrir ? () => aoAbrir(linha) : undefined}
                onKeyDown={aoAbrir ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(linha); } } : undefined}
                className={cn(aoAbrir && 'cursor-pointer hover:bg-hover focus-visible:bg-hover focus-visible:outline-none')}
              >
                {colunas.map((c) => (
                  <td key={c.chave} className={cn('border-b border-border px-4 py-3 text-sm', c.numerica && 'font-mono')}>{c.render(linha)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
